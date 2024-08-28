document.addEventListener('DOMContentLoaded', () => {
	const gpgpubtn = document.getElementById('gpgpu-btn');
	const spherebtn = document.getElementById('sphere-btn');

	if (gpgpubtn) {
		gpgpubtn.onclick = () => {
			window.location.href = 'index.html';
		};
	}

	if (spherebtn) {
		spherebtn.onclick = () => {
			window.location.href = 'sphere.html';
		};
	}
});
