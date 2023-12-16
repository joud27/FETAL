var igvDiv = document.getElementById("igv-div");
var button1 = document.getElementById("button1");
var blabla1 = document.getElementById("blabla1");
var blabla2 = document.getElementById("blabla2");

function fetchAndCombineReference() {
    return Promise.all([
        fetch(static_url + "data/GCF_part_1.fna").then(response => response.blob()),
        fetch(static_url + "data/GCF_part_2.fna").then(response => response.blob())
    ]).then(([blob1, blob2]) => {
        const combinedBlob = new Blob([blob1, blob2]);
        console.log("File 1 loaded");
        return URL.createObjectURL(combinedBlob);
    });
}

function fetchAndCombineGtf() {
    return Promise.all([
        fetch(static_url + "data/genomic_part_1.gtf").then(response => response.blob()),
        fetch(static_url + "data/genomic_part_2.gtf").then(response => response.blob())
    ]).then(([blob1, blob2]) => {
        const combinedBlob = new Blob([blob1, blob2]);
        console.log("File 2 loaded");
        return URL.createObjectURL(combinedBlob);
    });
}

function viewReference() {
    igvDiv.innerHTML="<p><b>IGV viewer is loading, please be patient...</b></p>";
    Promise.all([
        fetchAndCombineReference(),
        fetchAndCombineGtf()
    ]).then(([refURL, gtfURL]) => {
        var options = {
            reference: {
                "name": "GCF_000002595.2_Chlamydomonas_reinhardtii_v5.5",
                "fastaURL": refURL,
                "indexURL": static_url + "data/GCF_000002595.2_Chlamydomonas_reinhardtii_v5.5_genomic.fna.fai",
            },
            locus: "all",
            tracks: [{
                name: "Genes",
                type: "annotation",
                format: "gtf",
                url: gtfURL ,
                displayMode: "EXPANDED",
                nameField: "gene_id",
                colorBy: "gene_id",
                height: 160,
            }]
        };
        igvDiv.innerHTML="";
        igv.createBrowser(igvDiv, options)
            .then(function(browser) {
                igv.browser = browser;
                console.log("Created IGV browser");
            });
    }).catch(error => {
        console.error("Error:", error);
    });

    blabla1.innerHTML = `<p>GCF_000002595.2 Chlamydomonas reinhardtii v5.5 is a whole genome shotgun sequence from <i>Chlamydomonas reinhardtii CC-503 cw92</i>.</p>
    <p>NC_057004.1 to NC_057020: chromosomes 1 to 17 of <i>C. reinhardtii</i>.</p>
    <p>Sequences beginning with NW are unplaced genomic scaffolds.</p>
    <p><i>Eukaryota>Viridiplantae (green plants)>Chlorophyta (green algae)>Chlorophyceae>Chlamydomonales>Chlamydomonaceae>Chlamydomonas<i></p>
    <b>GCF_000002595.2 Chlamydomonas reinhardtii v5.5:</b><a href="https://www.ncbi.nlm.nih.gov/datasets/taxonomy/3055/" target="_blank"><b>National Center for Biotechnology Information (NCBI)</b></a>`;
    blabla2.innerHTML = `<p>The haploid genome of <i>C. reinhardtii</i> spans approximately 110 megabases and consists of 17 chromosomes.
    It stands as one of the earliest sequenced eukaryotic genomes, driven by its significance in various research fields,
    including cell biology, plant physiology, and algal biotechnology. Efforts for genome assembly and annotation are
    continuously advancing for further enhancements.</p>
    <p>HydA1 gene of <i>C. reinhardtii</i> is involved in 75% of the H<sub>2</sub> production. It is located on the Chromosome 3 (NC_057006:8216108-8220752) with NCBI locus tag: CHLRE_03g199800v5.</p>`
}

function viewCustom() {
    blabla1.innerHTML="";
    blabla2.innerHTML="";
    igvDiv.innerHTML=`
    <form id="fileUploadForm">
        <label for="fastaUpload">Choose a reference fasta file :</label>
        <input type="file" id="fastaUpload" name="fastaUpload"><br>
        <label for="indexUpload">Choose index file for the reference : </label>
        <input type="file" id="indexUpload" name="indexUpload"><br>
        <label for="bamUpload">Choose a bam file :</label>
        <input type="file" id="bamUpload" name="bamUpload"><br>
        <label for="bamIndexUpload">Choose index file for the bam :</label>
        <input type="file" id="bamIndexUpload" name="bamIndexUpload"><br>
        <input type="submit" value="Load files">
    </form>`

    var fileUploadForm=document.getElementById("fileUploadForm");
    fileUploadForm.addEventListener("submit",function(event) {
        event.preventDefault();

        var formData = new FormData(fileUploadForm);
        var referenceFile = formData.get("fastaUpload");
        var indexFile = formData.get("indexUpload");
        var bamFile = formData.get("bamUpload");
        var bamIndexFile = formData.get("bamIndexUpload");

        if (referenceFile.size >0 && indexFile.size >0 && bamFile.size >0 && bamIndexFile.size >0) {
            var referenceFileUrl = URL.createObjectURL(referenceFile);
            var indexFileURL = URL.createObjectURL(indexFile);
            var bamFileURL = URL.createObjectURL(bamFile);
            var bamIndexFileURL = URL.createObjectURL(bamIndexFile);

            var options = {
                reference: {
                    "fastaURL": referenceFileUrl,
                    "indexURL": indexFileURL,
                    "genomeAnnotations": [
                        {
                            "name": "Indexed File",
                            "indexURL": indexFileURL
                        }
                    ]
                },
                tracks: [{
                    name:"bam file",
                    format: "bam",
                    url: bamFileURL ,
                    indexURL: bamIndexFileURL,
                    displayMode: "EXPANDED",
                }]
            };

            igvDiv.innerHTML="";
            igv.createBrowser(igvDiv, options)
                .then(function(browser) {
                    igv.browser = browser;
                    console.log("Created IGV browser");
                });
            }
        else {
            alert("Please, select the four required files.");
        }
    });
}

button1.addEventListener("click",viewReference);
button2.addEventListener("click",viewCustom);

