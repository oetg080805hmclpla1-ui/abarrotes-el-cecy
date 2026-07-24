const btnIzq = document.querySelector(".btn-most-vent:first-child");
const btnDer = document.querySelector(".btn-most-vent:last-child");

const contenedor = document.querySelector(".nose");

const card = contenedor.querySelector(".content");
const cardStyle = getComputedStyle(card);
const cardWidth = card.offsetWidth + parseInt(cardStyle.marginLeft) + parseInt(cardStyle.marginRight);

actualizarBotones();

function actualizarBotones() {
  btnIzq.disabled = contenedor.scrollLeft <= 0;
  btnDer.disabled = contenedor.scrollLeft + contenedor.offsetWidth >= contenedor.scrollWidth - 1;
}

btnDer.addEventListener("click", () => {
  let nuevaPos = contenedor.scrollLeft + cardWidth * 5;
  if (nuevaPos + contenedor.offsetWidth > contenedor.scrollWidth) {
    nuevaPos = contenedor.scrollWidth - contenedor.offsetWidth;
  }
  contenedor.scrollTo({ left: nuevaPos, behavior: "smooth" });
});

btnIzq.addEventListener("click", () => {
  let nuevaPos = contenedor.scrollLeft - cardWidth * 5;
  if (nuevaPos < 0) nuevaPos = 0;
  contenedor.scrollTo({ left: nuevaPos, behavior: "smooth" });
});

contenedor.addEventListener("scroll", actualizarBotones);