// lê uma imagem, recorta no centro (quadrado) e reduz pra caber leve no banco
export function lerImagem(arquivo, lado = 128) {
  return new Promise((resolve, reject) => {
    if (!arquivo || !arquivo.type.startsWith("image/")) {
      return reject(new Error("Escolha um arquivo de imagem."));
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      return reject(new Error("Imagem muito grande (máximo 10 MB)."));
    }
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => {
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      const c = document.createElement("canvas");
      c.width = lado;
      c.height = lado;
      c.getContext("2d").drawImage(img, sx, sy, min, min, 0, 0, lado, lado);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/webp", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui ler essa imagem."));
    };
    img.src = url;
  });
}
