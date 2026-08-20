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
// Obtém transforms existentes no path e nos grupos
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
// Configura um path para ser somente contorno
// --------------------------------------------------

function configurarPath(path, cor, espessura) {

    // Remove style porque ele pode sobrescrever
    // fill, stroke etc.
    path.removeAttribute("style");

    path.setAttribute("fill", "none");
    path.setAttribute("stroke", cor);
    path.setAttribute("stroke-width", espessura);

    // Garante que a linha permaneça visível
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke-linecap", "round");
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
        mensagem.textContent = "Selecione primeiro um arquivo SVG.";
        return;
    }

    try {

        // --------------------------------------------------
        // Lê o arquivo
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

        const erroParser = documento.querySelector("parsererror");

        if (erroParser) {
            throw new Error("O arquivo SVG não pôde ser interpretado.");
        }


        // --------------------------------------------------
        // SVG original
        // --------------------------------------------------

        const svgOriginal = documento.documentElement;

        if (
            !svgOriginal ||
            svgOriginal.localName !== "svg"
        ) {
            throw new Error("O arquivo selecionado não é um SVG válido.");
        }


        // --------------------------------------------------
        // Localiza os paths
        // --------------------------------------------------

        const paths = svgOriginal.querySelectorAll("path");

        if (paths.length !== 2) {
            throw new Error(
                `O SVG deve possuir exatamente 2 paths. ` +
                `Foram encontrados ${paths.length}.`
            );
        }


        // --------------------------------------------------
        // Lê viewBox
        // --------------------------------------------------

        const viewBox = svgOriginal.getAttribute("viewBox");

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
            throw new Error("O viewBox do SVG é inválido.");
        }

        const [
            xInicial,
            yInicial,
            largura,
            altura
        ] = valores;


        // --------------------------------------------------
        // Parâmetros escolhidos
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

        const novoSvg = document.createElementNS(
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


        // --------------------------------------------------
        // PATH 1
        // --------------------------------------------------

        const path1Original = paths[0];

        const path1 = document.importNode(
            path1Original,
            true
        );

        const transform1 =
            obterTransformAcumulado(
                path1Original,
                svgOriginal
            );

        path1.removeAttribute("transform");

        if (transform1) {
            path1.setAttribute(
                "transform",
                transform1
            );
        }

        path1.setAttribute(
            "id",
            "path1"
        );

        configurarPath(
            path1,
            "#ff0000",
            espessura
        );


        // --------------------------------------------------
        // PATH 2
        // --------------------------------------------------

        const path2Original = paths[1];

        const path2 = document.importNode(
            path2Original,
            true
        );

        const transform2 =
            obterTransformAcumulado(
                path2Original,
                svgOriginal
            );

        path2.removeAttribute("transform");

        if (transform2) {
            path2.setAttribute(
                "transform",
                transform2
            );
        }

        path2.setAttribute(
            "id",
            "path2"
        );

        configurarPath(
            path2,
            "#ff0000",
            espessura
        );


        // --------------------------------------------------
        // Grupo do primeiro desenho
        // --------------------------------------------------

        const grupo1 = document.createElementNS(
            namespaceSvg,
            "g"
        );

        grupo1.setAttribute(
            "id",
            "desenho1"
        );

        grupo1.appendChild(path1);


        // --------------------------------------------------
        // Grupo do segundo desenho
        // deslocado verticalmente
        // --------------------------------------------------

        const grupo2 = document.createElementNS(
            namespaceSvg,
            "g"
        );

        grupo2.setAttribute(
            "id",
            "desenho2"
        );

        const deslocamentoY =
            altura + distancia;

        grupo2.setAttribute(
            "transform",
            `translate(0 ${deslocamentoY})`
        );

        grupo2.appendChild(path2);


        // --------------------------------------------------
        // Adiciona ao SVG
        // --------------------------------------------------

        novoSvg.appendChild(grupo1);
        novoSvg.appendChild(grupo2);


        // --------------------------------------------------
        // Converte novamente para texto
        // --------------------------------------------------

        const serializer =
            new XMLSerializer();

        const conteudoSvg =
            serializer.serializeToString(novoSvg);

        svgConvertido =
            '<?xml version="1.0" encoding="UTF-8"?>\n' +
            conteudoSvg;


        // --------------------------------------------------
        // Nome automático do arquivo
        // --------------------------------------------------

        const nomeOriginal =
            arquivo.name.replace(/\.svg$/i, "");

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

    const blob = new Blob(
        [svgConvertido],
        {
            type: "image/svg+xml;charset=utf-8"
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
