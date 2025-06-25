# list_files.py
import os

# --- CONFIGURACIÓN ---
# Ruta base de tu NUEVO proyecto refactorizado
base_dir = r"D:\proyectos\loyalpyme"
# Archivo de salida, se creará en el mismo directorio
output_file = os.path.join(base_dir, "project-all-code-refactored.txt")
# Extensiones de archivo a incluir
valid_extensions = (".ts", ".tsx", ".js", ".json", ".html", ".css", ".md")
# Carpetas a ignorar
ignored_dirs = {'node_modules', '.git', '.vscode', 'dist', '__pycache__'}
# --- FIN CONFIGURACIÓN ---

def main():
    print(f"Iniciando escaneo de archivos en: {base_dir}")
    all_files = []
    
    for root, dirs, files in os.walk(base_dir, topdown=True):
        # Modificar 'dirs' in-place para que os.walk no entre en las carpetas ignoradas
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        
        for file in files:
            if file.endswith(valid_extensions):
                full_path = os.path.join(root, file)
                # Crear ruta relativa desde la base del proyecto
                rel_path = os.path.relpath(full_path, base_dir)
                # Normalizar separadores para consistencia
                all_files.append((full_path, rel_path.replace(os.path.sep, '/')))

    # Ordenar alfabéticamente por la ruta relativa para un índice predecible
    all_files.sort(key=lambda x: x[1])

    print(f"Se encontraron {len(all_files)} archivos válidos. Escribiendo en {output_file}...")
    
    try:
        with open(output_file, "w", encoding="utf-8") as outfile:
            # --- Escribir el Índice ---
            outfile.write("# ÍNDICE DE ARCHIVOS (ESTRUCTURA REFACTORIZADA)\n\n")
            for idx, (_, rel_path) in enumerate(all_files, start=1):
                outfile.write(f"{idx}. {rel_path}\n")
            outfile.write("\n\n")
            
            # --- Escribir el Contenido ---
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
                    
        print(f"¡Éxito! El archivo '{os.path.basename(output_file)}' ha sido creado en la raíz de tu nuevo proyecto.")
    except Exception as e:
        print(f"ERROR FATAL al escribir el archivo de salida: {e}")

if __name__ == "__main__":
    main()