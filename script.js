const inputArquivo = document.getElementById("arquivoSvg");
const inputDistancia = document.getElementById("distancia");
const inputEspessura = document.getElementById("espessura");

const botaoConverter = document.getElementById("converter");
const botaoBaixar = document.getElementById("baixar");

const mensagem = document.getElementById("mensagem");
const resultado = document.getElementById("resultado");
const preview = document.getElementById("preview");

let svgConvertido = null;
let nomeArquivoSaida = null;


// --------------------------------------------------
// Obtém os transforms existentes no path e nos grupos
// que o envolvem.
// --------------------------------------------------

function obterTransformAcumulado(elemento, svgRaiz) {

    const transforms = [];

    let atual = elemento;

    while (atual && atual !== svgRaiz) {

        if (atual.hasAttribute("transform")) {
            transforms.unshift(atual.getAttribute("transform"));
        }

        atual = atual.parentElement;
    }

    return transforms.join(" ");
}


// --------------------------------------------------
// Configura um path como somente contorno
// --------------------------------------------------

function configurarPath(path, cor, espessura) {

    path.removeAttribute("style");

    path.setAttribute("fill", "none");
    path.setAttribute("stroke", cor);
    path.setAttribute("stroke-width", espessura);

    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
}


// --------------------------------------------------
// Cria uma cópia do path preservando sua posição
// original no SVG
// --------------------------------------------------

function copiarPath(pathOriginal, svgOriginal) {

    const copia = document.importNode(
        pathOriginal,
        true
    );

    const transform =
        obterTransformAcumulado(
            pathOriginal,
            svgOriginal
        );

    copia.removeAttribute("transform");

    if (transform) {
        copia.setAttribute(
            "transform",
            transform
        );
    }

    return copia;
}


// --------------------------------------------------
// Conversão
// --------------------------------------------------

async function converterSvg() {

    mensagem.textContent = "";
    resultado.hidden = true;
    svgConvertido = null;

    const arquivo = inputArquivo.files[0];

    if (!arquivo) {
        mensagem.textContent =
            "Selecione primeiro um arquivo SVG.";
        return;
    }

    try {

        // --------------------------------------------------
        // Lê o SVG
        // --------------------------------------------------

        const texto = await arquivo.text();

        const parser = new DOMParser();

        const documento = parser.parseFromString(
            texto,
            "image/svg+xml"
        );


        // --------------------------------------------------
        // Verifica erro de XML
        // --------------------------------------------------

        const erroParser =
            documento.querySelector("parsererror");

        if (erroParser) {
            throw new Error(
                "O arquivo SVG não pôde ser interpretado."
            );
        }


        // --------------------------------------------------
        // Obtém SVG original
        // --------------------------------------------------

        const svgOriginal =
            documento.documentElement;

        if (
            !svgOriginal ||
            svgOriginal.localName !== "svg"
        ) {
            throw new Error(
                "O arquivo selecionado não é um SVG válido."
            );
        }


        // --------------------------------------------------
        // Encontra os dois paths
        // --------------------------------------------------

        const paths =
            svgOriginal.querySelectorAll("path");

        if (paths.length !== 2) {

            throw new Error(
                `O SVG deve possuir exatamente 2 paths. ` +
                `Foram encontrados ${paths.length}.`
            );
        }


        // --------------------------------------------------
        // Lê viewBox
        // --------------------------------------------------

        const viewBox =
            svgOriginal.getAttribute("viewBox");

        if (!viewBox) {
            throw new Error(
                "O SVG não possui o atributo viewBox."
            );
        }

        const valores = viewBox
            .replace(/,/g, " ")
            .trim()
            .split(/\s+/)
            .map(Number);

        if (
            valores.length !== 4 ||
            valores.some(valor => Number.isNaN(valor))
        ) {
            throw new Error(
                "O viewBox do SVG é inválido."
            );
        }

        const [
            xInicial,
            yInicial,
            largura,
            altura
        ] = valores;


        // --------------------------------------------------
        // Parâmetros
        // --------------------------------------------------

        const distancia =
            Number(inputDistancia.value);

        const espessura =
            Number(inputEspessura.value);

        if (Number.isNaN(distancia)) {
            throw new Error(
                "A distância informada é inválida."
            );
        }

        if (
            Number.isNaN(espessura) ||
            espessura <= 0
        ) {
            throw new Error(
                "A espessura da linha é inválida."
            );
        }


        // --------------------------------------------------
        // Cria novo SVG
        // --------------------------------------------------

        const namespaceSvg =
            "http://www.w3.org/2000/svg";

        const novoSvg =
            document.createElementNS(
                namespaceSvg,
                "svg"
            );

        const novaAltura =
            altura * 2 + distancia;

        novoSvg.setAttribute(
            "xmlns",
            namespaceSvg
        );

        novoSvg.setAttribute(
            "viewBox",
            `${xInicial} ${yInicial} ${largura} ${novaAltura}`
        );


        // ==================================================
        // IMAGEM SUPERIOR
        // ==================================================

        const grupoSuperior =
            document.createElementNS(
                namespaceSvg,
                "g"
            );

        grupoSuperior.setAttribute(
            "id",
            "imagem-superior"
        );


        // --------------------------------------------------
        // PATH 1 - vermelho
        // --------------------------------------------------

        const path1 =
            copiarPath(
                paths[0],
                svgOriginal
            );

        path1.setAttribute(
            "id",
            "path1-vermelho"
        );

        configurarPath(
            path1,
            "#ff0000",
            espessura
        );


        // --------------------------------------------------
        // PATH 2 - azul
        // Mantém exatamente a posição original
        // --------------------------------------------------

        const path2Azul =
            copiarPath(
                paths[1],
                svgOriginal
            );

        path2Azul.setAttribute(
            "id",
            "path2-azul"
        );

        configurarPath(
            path2Azul,
            "#0000ff",
            espessura
        );


        // Adiciona os dois à imagem superior

        grupoSuperior.appendChild(path1);
        grupoSuperior.appendChild(path2Azul);


        // ==================================================
        // IMAGEM INFERIOR
        // ==================================================

        const grupoInferior =
            document.createElementNS(
                namespaceSvg,
                "g"
            );

        grupoInferior.setAttribute(
            "id",
            "imagem-inferior"
        );


        // --------------------------------------------------
        // PATH 2 - vermelho
        // --------------------------------------------------

        const path2Vermelho =
            copiarPath(
                paths[1],
                svgOriginal
            );

        path2Vermelho.setAttribute(
            "id",
            "path2-vermelho"
        );

        configurarPath(
            path2Vermelho,
            "#ff0000",
            espessura
        );


        // --------------------------------------------------
        // Move a imagem inferior para baixo
        // --------------------------------------------------

        const deslocamentoY =
            altura + distancia;

        grupoInferior.setAttribute(
            "transform",
            `translate(0 ${deslocamentoY})`
        );

        grupoInferior.appendChild(
            path2Vermelho
        );


        // ==================================================
        // Monta SVG final
        // ==================================================

        novoSvg.appendChild(
            grupoSuperior
        );

        novoSvg.appendChild(
            grupoInferior
        );


        // --------------------------------------------------
        // Serializa SVG
        // --------------------------------------------------

        const serializer =
            new XMLSerializer();

        const conteudoSvg =
            serializer.serializeToString(
                novoSvg
            );

        svgConvertido =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            conteudoSvg;


        // --------------------------------------------------
        // Nome do arquivo
        // --------------------------------------------------

        const nomeOriginal =
            arquivo.name.replace(
                /\.svg$/i,
                ""
            );

        nomeArquivoSaida =
            `${nomeOriginal}_convertido.svg`;


        // --------------------------------------------------
        // Preview
        // --------------------------------------------------

        preview.innerHTML =
            conteudoSvg;

        resultado.hidden = false;

        mensagem.textContent =
            "SVG convertido com sucesso.";

    }

    catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Erro: " + erro.message;

        resultado.hidden = true;
    }
}


// --------------------------------------------------
// Download
// --------------------------------------------------

function baixarSvg() {

    if (!svgConvertido) {
        return;
    }

    const blob =
        new Blob(
            [svgConvertido],
            {
                type:
                    "image/svg+xml;charset=utf-8"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;

    link.download =
        nomeArquivoSaida ||
        "convertido.svg";

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(url);
}


// --------------------------------------------------
// Eventos
// --------------------------------------------------

botaoConverter.addEventListener(
    "click",
    converterSvg
);

botaoBaixar.addEventListener(
    "click",
    baixarSvg
);
