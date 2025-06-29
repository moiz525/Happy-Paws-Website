// Enhanced renderAnimalForm function without image upload and description
function renderAnimalForm(animal = {}) {
  const isEdit = !!animal.AnimalID;
  const area = document.getElementById('animalFormArea');
  area.innerHTML = `
    <div style="border:1px solid #B57EDC; margin:1em 0; padding:1em;">
      <h4>${isEdit ? "Edit Animal" : "Add Animal"}</h4>
      <form id="animalForm">
        ${isEdit ? `<input type="hidden" name="AnimalID" value="${animal.AnimalID}">` : ""}
        <label>Name: <input type="text" name="Name" value="${animal.Name ?? ''}" required></label><br>
        <label>Species: <input type="text" name="Species" value="${animal.Species ?? ''}" required></label><br>
        <label>Breed: <input type="text" name="Breed" value="${animal.Breed ?? ''}"></label><br>
        <label>Age: <input type="number" name="Age" value="${animal.Age ?? ''}"></label><br>
        <label>Gender: <input type="text" name="Gender" value="${animal.Gender ?? ''}"></label><br>
        <label>Status: <input type="text" name="Status" value="${animal.Status ?? ''}" placeholder="Available, Adopted, etc."></label><br>

        <!-- Description field has been removed -->

        <!-- Image upload section has been removed -->

        <label>Featured on Homepage: <input type="checkbox" name="Featured" ${animal.Featured ? 'checked' : ''}></label><br>
        <button type="submit">${isEdit ? "Update" : "Add"}</button>
        <button type="button" id="cancelAnimalForm">Cancel</button>
        <div id="animalFormMsg"></div>
      </form>
    </div>
  `;

  // Handle form cancel
  area.querySelector('#cancelAnimalForm').onclick = () => area.innerHTML = '';

  // Handle form submission
  const form = area.querySelector('#animalForm');
  form.onsubmit = async function(e) {
    e.preventDefault();
    const msgElem = area.querySelector('#animalFormMsg');

    try {
      // Create payload - removed description field
      const payload = {
        Name: form.Name.value,
        Species: form.Species.value,
        Breed: form.Breed.value,
        Age: form.Age.value,
        Gender: form.Gender.value,
        Status: form.Status.value || 'Available',
        Featured: form.Featured.checked
      };

      // Keep the original image URLs and description if editing
      if (isEdit) {
        if (animal.ImageURL) {
          payload.ImageURL = animal.ImageURL;
          payload.imageURL = animal.imageURL;
          payload.SampleImageURL = animal.SampleImageURL;
        }

        // Keep the original description
        if (animal.Description) {
          payload.Description = animal.Description;
        }
      } else {
        // Default description for new animals
        payload.Description = `A lovely ${form.Species.value} looking for a forever home.`;
      }

      // Submit the form
      let res, data;
      if (isEdit) {
        res = await fetch(`http://localhost:5000/api/animals/${animal.AnimalID}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
      } else {
        res = await fetch('http://localhost:5000/api/animals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
      }

      msgElem.textContent = data.message;
      msgElem.style.color = data.success ? '#429d7a' : '#a04889';

      if (data.success) {
        // Force refresh the animal cache
        if (window.AnimalManager && typeof window.AnimalManager.clearCache === 'function') {
          window.AnimalManager.clearCache();

          // Force a new fetch to update the cache with the new data
          await window.AnimalManager.fetchAnimals(true);

          // Log success message
          console.log('Animal cache cleared and refreshed successfully');
        }

        setTimeout(() => {
          area.innerHTML = '';
          animalsSection();
        }, 800);
      }
    } catch (error) {
      console.error('Error submitting animal form:', error);
      msgElem.textContent = 'An error occurred. Please try again. Error: ' + error.message;
      msgElem.style.color = '#a04889';
    }
  };
}
