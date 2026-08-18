
const fs = require('fs');
let code = fs.readFileSync('src/app/(main)/personal/page.tsx', 'utf8');

code = code.replace(
  'const [contratistas, setContratistas] = useState<any[]>([]);',
  'const [contratistas, setContratistas] = useState<any[]>([]);\n  const [proyectos, setProyectos] = useState<any[]>([]);'
);

code = code.replace(
  'const [form, setForm] = useState({ documento: `, nombre: `, cargo: `, empresa: `, estado_arl: Al Día });',
  'const [form, setForm] = useState({ documento: `, nombre: `, cargo: `, empresa: `, estado_arl: Al Día, proyecto_asignado: ` });'
);

code = code.replace(
  /const \{ data: cData \} = await supabase\.from\('contratistas'\)\.select\('nombre'\)\.order\('nombre', \{ ascending: true \}\);\n    if \(cData\) setContratistas\(cData\);/g,
  const { data: cData } = await supabase.from('contratistas').select('nombre').order('nombre', { ascending: true });
    if (cData) setContratistas(cData);
    const { data: pData } = await supabase.from('proyectos').select('nombre').order('nombre', { ascending: true });
    if (pData) setProyectos(pData);
);

code = code.replace(
  'estado_arl: form.estado_arl\n        }).eq(id, editingId).select();',
  'estado_arl: form.estado_arl,\n          proyecto_asignado: form.proyecto_asignado || null\n        }).eq(id, editingId).select();'
);
code = code.replace(
  'estado_arl: form.estado_arl\n        }]).select();',
  'estado_arl: form.estado_arl,\n          proyecto_asignado: form.proyecto_asignado || null\n        }]).select();'
);

code = code.replace(
  'estado_arl: trabajador.estado_arl\n    });',
  'estado_arl: trabajador.estado_arl,\n      proyecto_asignado: trabajador.proyecto_asignado || `\n    });'
);

code = code.replace(
  /setForm\(\{ documento: "", nombre: "", cargo: "", empresa: "", estado_arl: "Al Día" \}\);/g,
  'setForm({ documento: `, nombre: `, cargo: `, empresa: `, estado_arl: Al Día, proyecto_asignado: ` });'
);

code = code.replace(
  '<TableHead className="font-semibold">Contratista</TableHead>',
  '<TableHead className="font-semibold">Contratista / Proyecto</TableHead>'
);

code = code.replace(
  '{p.empresa}\n                      </span>\n                    </TableCell>',
  '{p.empresa}\n                      </span>\n                      {p.proyecto_asignado && <span className="flex items-center gap-1 text-slate-500 text-xs mt-1 bg-slate-100 w-fit px-2 py-0.5 rounded">{p.proyecto_asignado}</span>}\n                    </TableCell>'
);

const selectHTML = <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Empresa Contratista</Label>
                    <Select value={form.empresa} onValueChange={(val) => setForm({...form, empresa: val || ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {contratistas.map(c => (
                          <SelectItem key={c.nombre} value={c.nombre}>{c.nombre}</SelectItem>
                        ))}
                        <SelectItem value="Astillero Interno">Astillero Interno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Proyecto Asignado</Label>
                    <Select value={form.proyecto_asignado} onValueChange={(val) => setForm({...form, proyecto_asignado: val || ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Ninguno" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Ninguno</SelectItem>
                        {proyectos.map(p => (
                          <SelectItem key={p.nombre} value={p.nombre}>{p.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>;

code = code.replace(
  /<div className="grid gap-2">\s*<Label>Empresa Contratista<\/Label>\s*<Select value=\{form\.empresa\}[\s\S]*?<\/Select>\s*<\/div>/,
  selectHTML
);

fs.writeFileSync('src/app/(main)/personal/page.tsx', code);

