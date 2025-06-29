document.addEventListener('DOMContentLoaded', async function(){
  const form = document.getElementById('adoptionForm');
  const animalIdInput = document.getElementById('adoptAnimal');
  const animalNameInput = document.getElementById('adoptAnimalName');
  const animalNameError = document.getElementById('animalNameError');
  const responseDiv = document.getElementById('adoptionResponse');
  const animalPreviewContainer = document.getElementById('animalPreview');
  const availableAnimalsGrid = document.getElementById('availableAnimalsGrid');
  const animalLoading = document.getElementById('animalLoading');

  let animalList = [];

  // Check login status when page loads
  checkLoginRequirement();

  // Fetch all animals for validation
  try {
    // Use the AnimalManager to get animals
    animalList = await window.AnimalManager.fetchAnimals();

    // Look for URL parameters for animal ID and name
    const urlParams = new URLSearchParams(window.location.search);
    const animalId = urlParams.get('id');
    const animalName = urlParams.get('name');

    // Pre-fill the form if parameters are present
    if (animalId && animalIdInput) {
      animalIdInput.value = animalId;

      // Find the animal to validate and get details
      const animal = animalList.find(a => String(a.AnimalID) === animalId);
      if (animal && animalNameInput) {
        animalNameInput.value = animal.Name;
        validateAnimalNameAndId();
        // Show animal preview
        showAnimalPreview(animal);
      } else if (animalName && animalNameInput) {
        // Use the name from the URL if animal not found
        animalNameInput.value = decodeURIComponent(animalName);
        validateAnimalNameAndId();
      }
    }

    // Display other available animals
    loadAvailableAnimals();
  } catch (e) {
    console.error('Error loading animals:', e);
    animalList = [];
    if (animalLoading) {
      animalLoading.textContent = 'Error loading animals. Please try again later.';
      animalLoading.style.color = '#a04889';
    }
  }

  // Function to display animal preview
  function showAnimalPreview(animal) {
    if (!animalPreviewContainer) return;

    animalPreviewContainer.style.display = 'block';
    animalPreviewContainer.innerHTML = '';

    const previewCard = document.createElement('div');
    previewCard.className = 'animal-preview-card';

    // Create image and info containers
    const imageContainer = document.createElement('div');
    imageContainer.className = 'animal-preview-image';


    const infoContainer = document.createElement('div');
    infoContainer.className = 'animal-preview-info';

    // Add animal details
    infoContainer.innerHTML = `
      <h3>You're adopting: ${animal.Name}</h3>
      <p><strong>Species:</strong> ${animal.Species || 'Unknown'}</p>
      ${animal.Breed ? `<p><strong>Breed:</strong> ${animal.Breed}</p>` : ''}
      ${animal.Age ? `<p><strong>Age:</strong> ${animal.Age}</p>` : ''}
      ${animal.Gender ? `<p><strong>Gender:</strong> ${animal.Gender}</p>` : ''}
      ${animal.Description ? `<p><strong>Description:</strong> ${animal.Description}</p>` : ''}
    `;

    // Assemble the card
    previewCard.appendChild(imageContainer);
    previewCard.appendChild(infoContainer);
    animalPreviewContainer.appendChild(previewCard);
  }

  // Function to load available animals
  async function loadAvailableAnimals() {
    if (!availableAnimalsGrid || !animalLoading) return;

    try {
      // Get available animals
      const availableAnimals = animalList.filter(animal =>
        animal.Status === 'Available' &&
        String(animal.AnimalID) !== animalIdInput.value
      );

      // Remove loading message
      animalLoading.remove();

      if (availableAnimals.length === 0) {
        const noAnimals = document.createElement('div');
        noAnimals.className = 'no-animals-message';
        noAnimals.textContent = 'No other animals available at the moment.';
        availableAnimalsGrid.appendChild(noAnimals);
        return;
      }

      // Add each animal to the grid (max 4)
      availableAnimals.slice(0, 4).forEach(animal => {
        availableAnimalsGrid.appendChild(window.AnimalManager.createAnimalCard(animal));
      });
    } catch (error) {
      console.error('Error loading available animals:', error);
      animalLoading.textContent = 'Error loading available animals.';
      animalLoading.style.color = '#a04889';
    }
  }

  function validateAnimalNameAndId() {
    const idVal = animalIdInput.value.trim();
    const nameVal = animalNameInput.value.trim().toLowerCase();
    const animal = animalList.find(a => (String(a.AnimalID) === idVal));

    if (!animal) {
      animalNameInput.style.border = "2px solid orange";
      animalNameError.textContent = "Animal ID not found.";
      // Clear any preview
      if (animalPreviewContainer) {
        animalPreviewContainer.style.display = 'none';
        animalPreviewContainer.innerHTML = '';
      }
      return false;
    }

    if (animal.Name.toLowerCase() !== nameVal) {
      animalNameInput.style.border = "2px solid red";
      animalNameError.textContent = `Animal name does not match Animal ID (${animal.Name}).`;
      // Clear any preview
      if (animalPreviewContainer) {
        animalPreviewContainer.style.display = 'none';
        animalPreviewContainer.innerHTML = '';
      }
      return false;
    }

    animalNameInput.style.border = "";
    animalNameError.textContent = "";

    // Show the animal preview
    showAnimalPreview(animal);
    return true;
  }

  // Function to check if user is logged in
  function checkLoginRequirement() {
    // Check if Auth is available from auth.js
    if (window.Auth && !window.Auth.isLoggedIn()) {
      // Create login requirement message
      if (!document.getElementById('loginRequirement')) {
        const loginMessage = document.createElement('div');
        loginMessage.id = 'loginRequirement';
        loginMessage.className = 'login-requirement-message';
        loginMessage.innerHTML = `
          <div class="login-message-header">Login Required</div>
          <p>You need to <a href="login.html" class="login-link" id="loginRedirectLink">login</a> or create an account before submitting an adoption application.</p>
        `;

        // Insert before the form
        form.parentNode.insertBefore(loginMessage, form);

        // Hide the form
        form.style.display = 'none';

        // Hide the preview if it exists
        if (animalPreviewContainer) {
          animalPreviewContainer.style.display = 'none';
        }

        // Add redirect handling to login link
        setTimeout(() => {
          const loginLink = document.getElementById('loginRedirectLink');
          if (loginLink) {
            loginLink.addEventListener('click', function(e) {
              // Save current page in session storage for redirect after login
              sessionStorage.setItem('loginRedirect', window.location.href);
            });
          }
        }, 100);
      }
    } else {
      // User is logged in, show the form
      if (form) form.style.display = '';

      // Remove login message if exists
      const loginMessage = document.getElementById('loginRequirement');
      if (loginMessage) loginMessage.remove();
    }
  }

  animalIdInput.addEventListener('input', () => {
    const idVal = animalIdInput.value.trim();
    const animal = animalList.find(a => (String(a.AnimalID) === idVal));
    if (animal) {
      animalNameInput.value = animal.Name;
      validateAnimalNameAndId();
    } else {
      // Clear the preview if animal not found
      if (animalPreviewContainer) {
        animalPreviewContainer.style.display = 'none';
        animalPreviewContainer.innerHTML = '';
      }
    }
  });

  animalNameInput.addEventListener('input', validateAnimalNameAndId);

  form.addEventListener('submit', async function(e){
    e.preventDefault();

    // Check if user is logged in
    if (window.Auth && !window.Auth.isLoggedIn()) {
      responseDiv.textContent = 'You must be logged in to submit an adoption application.';
      responseDiv.style.color = '#a04889';
      return;
    }

    responseDiv.textContent = '';
    if (!validateAnimalNameAndId()) {
      responseDiv.textContent = 'Animal ID and Name must match.';
      return;
    }

    // Get current user
    const currentUser = window.Auth ? window.Auth.getCurrentUser() : null;

    const payload = {
      adoptName: currentUser ? currentUser.name : form.adoptName.value, // Use name from login if available
      adoptAnimal: form.adoptAnimal.value,
      adoptAnimalName: form.adoptAnimalName.value,
      adoptContact: currentUser ? currentUser.email : form.adoptContact.value, // Use email from login if available
      adoptAddress: form.adoptAddress.value
    };

    try {
      const res = await fetch('http://localhost:5000/api/adoptions', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      responseDiv.textContent = data.message || 'No server message.';
      if (data.success) {
        form.reset();
        // Clear the preview after successful submission
        if (animalPreviewContainer) {
          animalPreviewContainer.style.display = 'none';
          animalPreviewContainer.innerHTML = '';
        }
      }
    } catch (err) {
      responseDiv.textContent = 'Submission failed. Please try again later.';
    }
  });
});
