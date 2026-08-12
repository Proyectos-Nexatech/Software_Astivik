"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// Necesitamos el Service Role Key para poder gestionar usuarios (crear/eliminar) usando la Admin API
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dummy.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function getUsuarios() {
  const { data, error } = await supabaseAdmin
    .from('perfiles_usuario')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (!authError && authData?.users) {
      return data.map(perfil => {
        const authUser = authData.users.find(u => u.id === perfil.id);
        return {
          ...perfil,
          email: authUser ? authUser.email : null
        };
      });
    }
  } catch (err) {
    console.error("Error fetching auth users:", err);
  }

  return data;
}

export async function crearUsuario(data: any) {
  const { email, password, nombre, rol } = data;
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para crear usuarios." };
  }

  try {
    let authUserId;
    // 1. Crear en Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true // Auto-confirm for admin created users
    });

    if (authError) {
      if (authError.message.includes("already been registered") || authError.message.includes("already exists")) {
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = listData?.users?.find(u => u.email === email);
        if (existingUser) {
          authUserId = existingUser.id;
          if (password) {
            await supabaseAdmin.auth.admin.updateUserById(authUserId, { password });
          }
        } else {
          throw authError;
        }
      } else {
        throw authError;
      }
    } else if (authData?.user) {
      authUserId = authData.user.id;
    }

    // 2. Crear perfil en perfiles_usuario
    if (authUserId) {
      const { error: profileError } = await supabaseAdmin.from('perfiles_usuario').insert({
        id: authUserId,
        nombre_completo: nombre,
        rol,
        estado: 'Activo'
      });

      if (profileError) {
        if (profileError.code === '23505') {
          return { success: false, error: "El perfil para este usuario ya existe en el sistema." };
        }
        // Fallback: delete auth user only if we just created it
        if (!authError && authData?.user) {
          await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        }
        throw profileError;
      }
    }

    revalidatePath("/configuracion");
    return { success: true };
  } catch (err: any) {
    console.error("Error creating user:", err);
    return { success: false, error: err.message || "Error desconocido al crear usuario" };
  }
}

export async function actualizarUsuario(data: any) {
  const { id, rol, estado, nombre, email } = data;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  try {
    const { error } = await supabaseAdmin
      .from('perfiles_usuario')
      .update({ nombre_completo: nombre, rol, estado })
      .eq('id', id);

    if (error) throw error;

    if (email) {
      const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(id, { email });
      if (updateAuthError) {
        console.error("Error updating auth email:", updateAuthError);
        // We do not throw to avoid failing the whole process if only email update fails
      }
    }
    
    revalidatePath("/configuracion");
    return { success: true };
  } catch (err: any) {
    console.error("Error updating user:", err);
    return { success: false, error: err.message };
  }
}

export async function eliminarUsuario(id: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { success: false, error: "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor." };
  }

  try {
    // 1. Eliminar de Auth (esto eliminará en cascada de perfiles_usuario si la DB está configurada así)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    // Ignoramos el error si el usuario ya no existe en Auth, para poder borrar perfiles huérfanos
    if (authError && !authError.message.includes("not found") && !authError.message.includes("not exist")) {
      console.warn("Auth delete warning:", authError);
    }
    
    // 2. Eliminar explícitamente de perfiles_usuario por si acaso
    await supabaseAdmin.from('perfiles_usuario').delete().eq('id', id);

    revalidatePath("/configuracion");
    return { success: true };
  } catch (err: any) {
    console.error("Error deleting user:", err);
    return { success: false, error: err.message };
  }
}
