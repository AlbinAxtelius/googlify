const assets = {
  eye: "./assets/eye.png",
};

const createImage = (imageURL) =>
  new Promise((resolve, reject) => {
    const imageElement = document.createElement("img");

    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = (event) => {
      console.error(event);
      reject(event);
    };

    imageElement.crossOrigin = "anonymous";

    imageElement.src = imageURL;
  });

const createCanvas = (width, height) => {
  const canvas = document.createElement("canvas");

  canvas.height = height;
  canvas.width = width;

  const context = canvas.getContext("2d");

  return [canvas, context];
};

const drawEye = async (x, y, faceSize, context) => {
  const scaleFactor = 0.2; //Scale of eye
  const eye = await createImage(assets.eye);

  const size = faceSize * scaleFactor;

  context.drawImage(eye, x - size / 2, y - size / 2, size, size);
};

const generateImage = async (imageURL) => {
  const model = await blazeface.load();
  const image = await createImage(imageURL);

  const predictions = await model.estimateFaces(image, false);

  const [canvas, context] = createCanvas(image.width, image.height);

  context.drawImage(image, 0, 0);

  const promises = predictions.map(async (prediction) => {
    const start = prediction.topLeft;
    const end = prediction.bottomRight;

    const faceWidth = end[0] - start[0];
    const faceHeight = end[1] - start[1];

    const faceSize = Math.max(faceWidth, faceHeight);

    const rightEyeX = prediction.landmarks[0][0];
    const rightEyeY = prediction.landmarks[0][1];

    const leftEyeX = prediction.landmarks[1][0];
    const leftEyeY = prediction.landmarks[1][1];

    // const [
    //   [rightEyeX, rightEyeY], //Position for right eye
    //   [leftEyeX, leftEyeY], //Position for left eye
    // ] = prediction.landmarks;

    await drawEye(rightEyeX, rightEyeY, faceSize, context);
    await drawEye(leftEyeX, leftEyeY, faceSize, context);
  });

  await Promise.all(promises);

  return canvas.toDataURL();
};

(async () => {
  const imageElement = document.querySelector("img");

  document
    .querySelector("input")
    .addEventListener("change", async ({ target: { files } }) => {
      if (files.length === 0) return alert("No files provided.");

      const file = files[0];

      if (!file.type.startsWith("image")) return alert("No image provided");

      const url = URL.createObjectURL(files[0]);
      const src = await generateImage(url);

      imageElement.src = src;
    });
})();
