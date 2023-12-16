from flask import Flask, render_template, request, redirect, url_for, jsonify, send_file
from werkzeug.utils import secure_filename
import os
from Bio import Phylo
import matplotlib.pyplot as plt
from Bio.Phylo.Applications import PhymlCommandline
import subprocess
import tempfile

app = Flask(__name__)


uploaded_files = {}

UPLOAD_FOLDER = 'DATABASE'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/')
def home():
    return render_template('index.html', files=uploaded_files)

@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return redirect(request.url)

    file = request.files['file']

    if file.filename == '':
        return redirect(request.url)

    if file:
        uploaded_files[file.filename] = {'status': 'uploaded'}

        file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(file.filename))
        print("Full File Path:", file_path)

        file.save(file_path)
        print("File saved successfully.")

        return redirect('/')

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    with open(file_path, 'r') as file:
        file_content = file.read()
    return render_template('display_file.html', filename=filename, file_content=file_content)

@app.route('/display_database_file/<filename>')
def display_database_file(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    with open(file_path, 'r') as file:
        file_content = file.read()
    return render_template('display_file.html', filename=filename, file_content=file_content)

@app.route('/delete_file', methods=['POST'])
def delete_file():
    file_to_delete = request.form.get('delete_file')

    file_path = os.path.join(app.config['UPLOAD_FOLDER'], file_to_delete)
    if os.path.exists(file_path):
        os.remove(file_path)

        uploaded_files.pop(file_to_delete, None)

        return redirect('/phylogenie')
    else:
        return jsonify({'error': 'File not found in the list'})



@app.route('/links')
def links():
    return render_template('links.html')
@app.route('/genome')
def genome():
    return render_template('genome.html')

@app.route('/chlamydomonas')
def chlamydomonas():
    return render_template('chlamydomonas.html')

@app.route('/alignement')
def alignement():
    return render_template('alignement.html')

@app.route('/alignement_BWA', methods=['POST'])
def alignement_BWA():
    ref_file = request.files['ref_file']
    reads_file = request.files['reads_file']

    if ref_file and reads_file:
        ref_filename = 'temp_ref.fasta'
        reads_filename = 'temp_reads.fastq'
        ref_file.save(ref_filename)
        reads_file.save(reads_filename)

        resultats_alignement = effectuer_align(ref_filename, reads_filename)

        os.unlink(ref_filename)
        os.unlink(reads_filename)

        return render_template('alignement.html', resultats=resultats_alignement)

    return render_template('alignement.html', resultats="Veuillez sélectionner les fichiers.")

def effectuer_align(ref_filename, reads_filename):
    index_bwa = f"bwa index {ref_filename}"
    resultat_index = subprocess.run(index_bwa, shell=True, capture_output=True, text=True)

    commande_bwamem = f"bwa mem -t 4 {ref_filename} {reads_filename} > ./output.sam"
    resultat_bwamem = subprocess.run(commande_bwamem, shell=True, capture_output=True, text=True)

    commande_samtools = f"samtools view -Sb output.sam > output.bam"
    subprocess.run(commande_samtools, shell=True)

    sorted_samtools = f"samtools sort output.bam -o sorted.bam"
    subprocess.run(sorted_samtools, shell=True)

    index_samtools = f"samtools index sorted.bam"
    subprocess.run(index_samtools, shell=True)

    return "Alignement réussi"

@app.route('/phylogenie')
def phylogenie():
    database_files = os.listdir(app.config['UPLOAD_FOLDER'])
    return render_template('phylogenie.html', database_files=database_files)

@app.route('/perform_phylogeny', methods=['POST'])
def perform_phylogeny():
    selected_file = request.form.get('phylogenetic_file')
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], selected_file)

    results_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'phylogenetic_results')
    output_tree_path = os.path.join(results_folder, f"{os.path.splitext(selected_file)[0]}_phyml_tree.txt")

    # Perform phylogenetic analysis using PhyML
    phyml_cmd = PhymlCommandline(
        input=file_path,
        datatype='nt',
        model='GTR',
        bootstrap=100,
    )
    stdout, stderr = phyml_cmd()

    return redirect('/phylogenie')
    # return jsonify({'message': 'Phylogenetic analysis completed'})

@app.route('/tree_visualization', methods=['POST'])
def tree_visualization():
    selected_file = request.form.get('visualization_file')
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], selected_file)

    if os.path.exists(file_path) and selected_file.endswith('.txt'):
        # Lire le fichier avec Phylo.read
        tree = Phylo.read(file_path, 'newick')
        plt.figure(figsize=(300, 300))  # Adjust size if needed
        Phylo.draw(tree, do_show=False)
        plt.savefig('tree.png')

        return send_file('tree.png', mimetype='image/png')
    else:
        return jsonify({'error': 'Invalid file for tree visualization'})


@app.route('/display_phylogeny_file/<filename>')
def display_phylogeny_file(filename):
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    with open(file_path, 'r') as file:
        file_content = file.read()
    return render_template('display_file.html', filename=filename, file_content=file_content)


if __name__ == '__main__':
    app.run(debug=True)

