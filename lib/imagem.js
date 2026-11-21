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

// imagem da sala: mantém a proporção, reduz pra no máximo 960 px e comprime
export function lerImagemSala(arquivo, maxLado = 960) {
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
      const esc = Math.min(1, maxLado / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * esc));
      c.height = Math.max(1, Math.round(img.height * esc));
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let q = 0.8;
      let saida = c.toDataURL("image/webp", q);
      while (saida.length > 450000 && q > 0.4) {
        q -= 0.1;
        saida = c.toDataURL("image/webp", q);
      }
      if (saida.length > 550000) {
        return reject(new Error("A imagem continua grande demais. Escolha uma menor."));
      }
      resolve(saida);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não consegui ler essa imagem."));
    };
    img.src = url;
  });
}
