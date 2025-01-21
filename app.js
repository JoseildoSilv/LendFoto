class FotoApp {
    constructor() {
      this.mediaStream = null;
      this.photoGallery = [];
      
      this.initializeElements();
      this.addEventListeners();
      this.startCamera();
      this.loadPhotos();
    }
  
    initializeElements() {
      this.videoElement = document.getElementById('camera');
      this.canvasElement = document.getElementById('canvas');
      this.captureButton = document.getElementById('capture-btn');
      this.galleryElement = document.getElementById('photo-gallery');
      this.photoTemplate = document.getElementById('photo-template');
    }
  
    addEventListeners() {
      this.captureButton.addEventListener('click', () => this.capturePhoto());
    }
  
    async startCamera() {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        this.videoElement.srcObject = this.mediaStream;
      } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        alert('Não foi possível acessar a câmera');
      }
    }
  
    async capturePhoto() {
      const context = this.canvasElement.getContext('2d');
      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      context.drawImage(this.videoElement, 0, 0);
  
      try {
        const location = await this.getCurrentLocation();
        const photoData = {
          image: this.canvasElement.toDataURL('image/jpeg'),
          timestamp: new Date(),
          location: location,
          description: this.generateDescription(location)
        };
  
        await this.savePhoto(photoData);
        this.addPhotoToGallery(photoData);
      } catch (error) {
        console.error('Erro ao capturar foto:', error);
        alert('Erro ao capturar foto');
      }
    }
  
    async getCurrentLocation() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          position => resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }),
          error => reject(error)
        );
      });
    }
  
    generateDescription(location) {
      const date = new Date();
      return `A foto foi tirada em Latitude: ${location.latitude.toFixed(4)}, ` +
             `Longitude: ${location.longitude.toFixed(4)} no dia ` +
             `${date.toLocaleDateString()} às ${date.toLocaleTimeString()}`;
    }
  
    async savePhoto(photoData) {
      try {
        // Salvar no Firebase
        const imageRef = storage.ref().child(`photos/${Date.now()}.jpg`);
        await imageRef.putString(photoData.image, 'data_url');
        const imageUrl = await imageRef.getDownloadURL();
  
        await db.collection('photos').add({
          imageUrl,
          timestamp: photoData.timestamp,
          location: photoData.location,
          description: photoData.description
        });
      } catch (error) {
        console.error('Erro ao salvar foto:', error);
        throw error;
      }
    }
  
    async loadPhotos() {
      try {
        const snapshot = await db.collection('photos').orderBy('timestamp', 'desc').get();
        snapshot.forEach(doc => {
          const photoData = doc.data();
          photoData.id = doc.id;
          this.addPhotoToGallery(photoData);
        });
      } catch (error) {
        console.error('Erro ao carregar fotos:', error);
      }
    }
  
    addPhotoToGallery(photoData) {
      const photoElement = this.photoTemplate.content.cloneNode(true);
      
      const img = photoElement.querySelector('.photo-image');
      img.src = photoData.imageUrl || photoData.image;
      
      const description = photoElement.querySelector('.photo-description');
      description.textContent = photoData.description;
  
      const shareBtn = photoElement.querySelector('.share-btn');
      shareBtn.addEventListener('click', () => this.sharePhoto(photoData));
  
      const deleteBtn = photoElement.querySelector('.delete-btn');
      deleteBtn.addEventListener('click', () => this.deletePhoto(photoData));
  
      this.galleryElement.prepend(photoElement);
    }
  
    async sharePhoto(photoData) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Minha Foto',
            text: photoData.description,
            url: photoData.imageUrl
          });
        } else {
          alert('Compartilhamento não suportado neste navegador');
        }
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
      }
    }
  
    async deletePhoto(photoData) {
      if (!confirm('Tem certeza que deseja excluir esta foto?')) return;
  
      try {
        await db.collection('photos').doc(photoData.id).delete();
        await storage.refFromURL(photoData.imageUrl).delete();
        
        // Remover do DOM
        const photoElement = this.galleryElement.querySelector(`[data-id="${photoData.id}"]`);
        if (photoElement) {
          photoElement.remove();
        }
      } catch (error) {
        console.error('Erro ao excluir foto:', error);
        alert('Erro ao excluir foto');
      }
    }
  }
  
  // Inicializar o app quando o documento estiver pronto
  document.addEventListener('DOMContentLoaded', () => {
    new FotoApp();
  });