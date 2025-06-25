# list_files_camarero.py
import os

# --- CONFIGURACIÓN ---
# Ruta base de tu proyecto refactorizado
base_dir = r"D:\proyectos\loyalpyme"
# Archivo de salida, se creará en el mismo directorio
output_file = os.path.join(base_dir, "project-camarero-module.txt")

# Carpetas ESPECÍFICAS a incluir (deben existir)
# Incluimos los módulos específicos y todo lo que sea 'shared'
include_only_dirs = {
    os.path.join(base_dir, "backend", "src", "modules", "camarero"),
    os.path.join(base_dir, "frontend", "src", "modules", "camarero"),
    os.path.join(base_dir, "backend", "src", "shared"),
    os.path.join(base_dir, "frontend", "src", "shared"),
}

# Archivos específicos a incluir SIEMPRE (para dar contexto)
always_include_files = {
    "README.md", "package.json", "tsconfig.json", "vite.config.ts",
    "index.html", "postcss.config.js", "tailwind.config.js", # Añade otros si los tienes
    os.path.join("backend", "src", "index.ts"), # El punto de entrada es importante
    os.path.join("backend", "src", "routes", "index.ts"), # El enrutador principal es importante
    os.path.join("frontend", "src", "routes", "index.tsx"), # El enrutador de frontend es importante
    os.path.join("frontend", "src", "main.tsx"), # El punto de entrada de React es importante
}

# Configuración general (sin cambios)
valid_extensions = (".ts", ".tsx", ".js", ".json", ".html", ".css", ".md")
ignored_dirs = {'node_modules', '.git', '.vscode', 'dist', '__pycache__'}
# --- FIN CONFIGURACIÓN ---

def is_in_included_dir(path, included_dirs):
    """Comprueba si una ruta está dentro de alguna de las carpetas a incluir."""
    for included_dir in included_dirs:
        if os.path.commonpath([path, included_dir]) == included_dir:
            return True
    return False

def main():
    print(f"Iniciando escaneo para el MÓDULO CAMARERO en: {base_dir}")
    all_files = []
    
    for root, dirs, files in os.walk(base_dir, topdown=True):
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        for file in files:
            full_path = os.path.join(root, file)
            rel_path_norm = os.path.relpath(full_path, base_dir).replace(os.path.sep, '/')

            # Condición de inclusión:
            # 1. El archivo está en la lista 'always_include_files'
            # O
            # 2. El archivo está dentro de una de las carpetas 'include_only_dirs' Y tiene una extensión válida
            
            is_always_included = rel_path_norm in always_include_files or os.path.basename(rel_path_norm) in always_include_files
            is_in_module_or_shared = is_in_included_dir(full_path, include_only_dirs) and file.endswith(valid_extensions)

            if is_always_included or is_in_module_or_shared:
                all_files.append((full_path, rel_path_norm))

    all_files = sorted(list(set(all_files)), key=lambda x: x[1])

    print(f"Se encontraron {len(all_files)} archivos válidos. Escribiendo en {output_file}...")
    
    try:
        with open(output_file, "w", encoding="utf-8") as outfile:
            outfile.write("# ÍNDICE DE ARCHIVOS (MÓDULO CAMARERO + SHARED)\n\n")
            for idx, (_, rel_path) in enumerate(all_files, start=1):
                outfile.write(f"{idx}. {rel_path}\n")
            outfile.write("\n\n")
            
            outfile.write("# CONTENIDO DE ARCHIVOS\n\n")
            for idx, (full_path, rel_path) in enumerate(all_files, start=1):
                try:
                    with open(full_path, "r", encoding="utf-8", errors='ignore') as infile:
                        content = infile.read()
                    outfile.write(f"\n// ====== [{idx}] {rel_path} ======\n")
                    outfile.write(content)
                    outfile.write("\n\n")
                except Exception as e:
                    print(f"  ERROR al leer el archivo {full_path}: {e}")
                    outfile.write(f"\n// ====== [{idx}] {rel_path} (ERROR DE LECTURA) ======\n")
                    outfile.write(f"// No se pudo leer el archivo. Error: {e}\n\n")
                    
        print(f"¡Éxito! El archivo '{os.path.basename(output_file)}' ha sido creado.")
    except Exception as e:
        print(f"ERROR FATAL al escribir el archivo de salida: {e}")

if __name__ == "__main__":
    main()