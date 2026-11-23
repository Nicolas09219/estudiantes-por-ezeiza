(function () {
	const raiz = document.getElementById('instagram-carrusel');
	if (!raiz) return;

	const pista = raiz.querySelector('.carrusel-pista');
	const vista = raiz.querySelector('.carrusel-ventana');
	const barra = raiz.querySelector('.carrusel-progreso span');
	const puntos = raiz.querySelector('.carrusel-puntos');
	const zonaIzq = raiz.querySelector('.carrusel-zona-izq');
	const zonaDer = raiz.querySelector('.carrusel-zona-der');
	const intervaloMs = 4500;
	const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	const reales = Array.from(pista.children);
	const total = reales.length;
	let indice = 0;
	let autoplay = null;
	let repeticion = null;

	reales.forEach((slide, i) => {
		const punto = document.createElement('button');
		punto.type = 'button';
		punto.className = 'carrusel-punto';
		punto.setAttribute('aria-label', 'Ir a la publicación ' + (i + 1));
		punto.addEventListener('click', () => {
			ir(i);
			iniciarAutoplay();
		});
		puntos.appendChild(punto);
	});

	const ultimo = reales[total - 1].cloneNode(true);
	const primero = reales[0].cloneNode(true);
	ultimo.setAttribute('aria-hidden', 'true');
	primero.setAttribute('aria-hidden', 'true');
	pista.prepend(ultimo);
	pista.append(primero);

	const slides = Array.from(pista.children);
	let posicion = 1;
	raiz.style.setProperty('--carrusel-intervalo', intervaloMs + 'ms');

	function desplazamiento(pos) {
		const slide = slides[pos];
		return slide.offsetLeft - (vista.clientWidth - slide.offsetWidth) / 2;
	}

	function marcarActivo() {
		slides.forEach((slide, i) => slide.classList.toggle('activo', i === posicion));
		puntos.querySelectorAll('.carrusel-punto').forEach((punto, i) => {
			const activo = i === indice;
			punto.classList.toggle('activo', activo);
			punto.setAttribute('aria-current', activo ? 'true' : 'false');
		});
		raiz.setAttribute('aria-label', 'Publicación ' + (indice + 1) + ' de ' + total);
	}

	function reiniciarProgreso() {
		barra.classList.remove('corriendo');
		void barra.offsetWidth;
		if (!reducido && autoplay) barra.classList.add('corriendo');
	}

	function colocar(pos, inmediato) {
		posicion = pos;
		if (pos === 0) indice = total - 1;
		else if (pos === total + 1) indice = 0;
		else indice = pos - 1;
		pista.style.transition = inmediato || reducido ? 'none' : '';
		pista.style.transform = 'translate3d(' + (-desplazamiento(pos)) + 'px, 0, 0)';
		marcarActivo();
		if (inmediato || reducido) {
			void pista.offsetWidth;
			pista.style.transition = '';
		}
	}

	function ir(destino) {
		const normalizado = (destino + total) % total;
		const diferencia = (normalizado - indice + total) % total;
		if (diferencia === 1) colocar(posicion === slides.length - 1 ? 2 : posicion + 1, false);
		else if (diferencia === total - 1) colocar(posicion === 0 ? total - 1 : posicion - 1, false);
		else colocar(normalizado + 1, false);
		reiniciarProgreso();
	}

	function iniciarAutoplay() {
		clearInterval(autoplay);
		autoplay = null;
		if (reducido || document.hidden || raiz.hidden) return;
		autoplay = setInterval(() => ir(indice + 1), intervaloMs);
		raiz.classList.remove('pausado');
		reiniciarProgreso();
	}

	function detenerAutoplay() {
		clearInterval(autoplay);
		autoplay = null;
		raiz.classList.add('pausado');
		barra.classList.remove('corriendo');
	}

	function repetir(direccion) {
		clearInterval(repeticion);
		ir(indice + direccion);
		repeticion = setInterval(() => ir(indice + direccion), 1100);
	}

	function soltarZona() {
		clearInterval(repeticion);
		repeticion = null;
		iniciarAutoplay();
	}

	zonaIzq.addEventListener('pointerenter', (evento) => {
		if (evento.pointerType === 'touch') return;
		detenerAutoplay();
		repetir(-1);
	});
	zonaDer.addEventListener('pointerenter', (evento) => {
		if (evento.pointerType === 'touch') return;
		detenerAutoplay();
		repetir(1);
	});
	[zonaIzq, zonaDer].forEach((zona) => {
		zona.addEventListener('pointerleave', soltarZona);
		zona.addEventListener('pointerdown', (evento) => {
			if (evento.pointerType !== 'touch') return;
			evento.preventDefault();
			detenerAutoplay();
			ir(indice + (zona === zonaDer ? 1 : -1));
		});
		zona.addEventListener('pointerup', (evento) => {
			if (evento.pointerType === 'touch') iniciarAutoplay();
		});
		zona.addEventListener('keydown', (evento) => {
			if (evento.key !== 'Enter' && evento.key !== ' ') return;
			evento.preventDefault();
			ir(indice + (zona === zonaDer ? 1 : -1));
			iniciarAutoplay();
		});
	});

	pista.addEventListener('transitionend', (evento) => {
		if (evento.target !== pista || evento.propertyName !== 'transform') return;
		if (posicion === 0) colocar(total, true);
		else if (posicion === total + 1) colocar(1, true);
	});

	let toqueX = 0;
	vista.addEventListener('touchstart', (evento) => {
		toqueX = evento.changedTouches[0].clientX;
		detenerAutoplay();
	}, { passive: true });
	vista.addEventListener('touchend', (evento) => {
		const delta = evento.changedTouches[0].clientX - toqueX;
		if (delta > 48) ir(indice - 1);
		else if (delta < -48) ir(indice + 1);
		iniciarAutoplay();
	}, { passive: true });

	document.addEventListener('visibilitychange', () => {
		if (document.hidden) detenerAutoplay();
		else iniciarAutoplay();
	});
	window.addEventListener('hashchange', () => {
		if (document.getElementById('inicio').hidden) detenerAutoplay();
		else iniciarAutoplay();
	});
	window.addEventListener('resize', () => colocar(indice + 1, true));

	colocar(1, true);
	iniciarAutoplay();
})();
