document.addEventListener('DOMContentLoaded', function() {
  const script = document.createElement('script');
  script.src = 'animal-form-enhanced.js';
  script.onload = function() {
    console.log('Enhanced animal form loaded successfully');
  };
  script.onerror = function() {
    console.error('Failed to load enhanced animal form');
  };
  document.head.appendChild(script);
});

function showSection(sectionId) {
  document.getElementById('dashboardSection').style.display = sectionId === 'dashboardSection' ? '' : 'none';
  document.getElementById('loginSection').style.display = sectionId === 'loginSection' ? '' : 'none';
}

async function apiAdminLogin(username, password) {
  try {
    const res = await fetch('http://localhost:5000/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    return data.success;
  } catch (err) {
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Add clearCache to AnimalManager if it exists
  if (window.AnimalManager && !window.AnimalManager.clearCache) {
    window.AnimalManager.clearCache = function() {
      console.log('Clearing animal cache to ensure fresh data');
      window.AnimalManager.animalCache = null;
      window.AnimalManager.lastFetchTime = 0;
    };
  }

  const adminLoginForm = document.getElementById('adminLoginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const loginResp = document.getElementById('loginResponse');

  // Check if admin is logged in when page loads
  if (localStorage.getItem('admin') === 'true') {
    showSection('dashboardSection');
    // Trigger animals section by default
    document.querySelector('[data-entity="animals"]').click();
  } else {
    showSection('loginSection');
  }

  adminLoginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const username = adminLoginForm.username.value;
    const password = adminLoginForm.password.value;
    if (await apiAdminLogin(username, password)) {
      // Store admin status in localStorage
      localStorage.setItem('admin', 'true');
      showSection('dashboardSection');
      logoutBtn.style.display = '';
      loginResp.textContent = '';
      // Trigger animals section by default
      document.querySelector('[data-entity="animals"]').click();

      // Update navigation if Auth is available
      if (window.Auth) {
        window.Auth.updateNavigation();
      }
    } else {
      loginResp.textContent = 'Invalid username or password.';
    }
    adminLoginForm.reset();
  });

  logoutBtn.addEventListener('click', function () {
    // Use the Auth handler if available
    if (window.Auth && window.Auth.handleAdminLogout) {
      window.Auth.handleAdminLogout({ preventDefault: () => {} });
    } else {
      // Fallback to direct logout
      localStorage.removeItem('admin');
      window.location.href = 'login.html';
    }
  });

  document.querySelector('#dashboardSection nav button[data-entity="animals"]').addEventListener('click', animalsSection);
  document.querySelector('#dashboardSection nav button[data-entity="medical"]').addEventListener('click', medicalSection);
  document.querySelector('#dashboardSection nav button[data-entity="applications"]').addEventListener('click', adoptionsSection);
  document.querySelector('#dashboardSection nav button[data-entity="donors"]').addEventListener('click', donorsSection);
  document.querySelector('#dashboardSection nav button[data-entity="donations"]').addEventListener('click', donationsSection);
  document.querySelector('#dashboardSection nav button[data-entity="volunteers"]').addEventListener('click', volunteersSection);
});

// --------- ANIMALS MANAGEMENT --------- //
async function animalsSection() {
  const res = await fetch('http://localhost:5000/api/animals');
  const animals = await res.json();
  renderAnimalTable(animals);
}

function renderAnimalTable(animals) {
  let html = '<h3>Manage Animals</h3>';
  html += `<button id="addAnimalBtn">Add Animal</button>`;
  html += `
    <table border="1" cellpadding="4">
      <tr>
        <th>ID</th><th>Name</th><th>Species</th><th>Breed</th><th>Age</th><th>Gender</th><th>Status</th><th>Actions</th>
      </tr>
  `;
  animals.forEach(a => {
    html += `
      <tr>
        <td>${a.AnimalID ?? ""}</td>
        <td>${a.Name ?? ""}</td>
        <td>${a.Species ?? ""}</td>
        <td>${a.Breed ?? ""}</td>
        <td>${a.Age ?? ""}</td>
        <td>${a.Gender ?? ""}</td>
        <td>${a.Status ?? ""}</td>
        <td>
          <button class="edit-animal" data-id="${a.AnimalID}">Edit</button>
          <button class="delete-animal" data-id="${a.AnimalID}">Delete</button>
        </td>
      </tr>
    `;
  });
  html += "</table><div id='animalFormArea'></div>";
  document.getElementById('adminContent').innerHTML = html;

  document.getElementById('addAnimalBtn').onclick = function() {
    // Always use the enhanced form if available
    if (typeof window.renderAnimalForm === 'function') {
      window.renderAnimalForm();
    } else {
      // Use the bundled renderAnimalForm as fallback
      renderAnimalForm();
    }
  };

  document.querySelectorAll('.edit-animal').forEach(btn => {
    btn.onclick = function() {
      const animal = animals.find(a => a.AnimalID == btn.getAttribute('data-id'));
      // Always use the enhanced form if available
      if (typeof window.renderAnimalForm === 'function') {
        window.renderAnimalForm(animal);
      } else {
        // Use the bundled renderAnimalForm as fallback
        renderAnimalForm(animal);
      }
    };
  });

  document.querySelectorAll('.delete-animal').forEach(btn => {
    btn.onclick = async function() {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this animal?')) {
        const res = await fetch(`http://localhost:5000/api/animals/${id}`, { method: 'DELETE' });
        const result = await res.json();
        alert(result.message);

        // Force refresh the animal cache and reload
        if (window.AnimalManager && typeof window.AnimalManager.clearCache === 'function') {
          window.AnimalManager.clearCache();
        }

        animalsSection();
      }
    };
  });
}

// This is a fallback version which will be used if enhanced version fails to load
function renderAnimalForm(animal = {}) {
  console.log('Using fallback animal form - enhanced version not loaded');
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
        <!-- Image section has been removed -->

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

      // Keep existing image URLs and description if editing
      if (isEdit) {
        if (animal.ImageURL) {
          payload.ImageURL = animal.ImageURL;
          payload.imageURL = animal.imageURL;
          payload.SampleImageURL = animal.SampleImageURL;
        }

        // Keep original description
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

// --------- MEDICAL RECORDS MANAGEMENT --------- //
async function medicalSection() {
  const res = await fetch('http://localhost:5000/api/medical');
  const records = await res.json();
  renderMedicalTable(records);
}

function renderMedicalTable(records) {
  let html = '<h3>Manage Medical Records</h3>';
  html += `<button id="addMedicalBtn">Add Medical Record</button>`;
  html += `
    <table border="1" cellpadding="4">
      <tr>
        <th>RecordID</th><th>AnimalID</th><th>Date</th><th>Description</th><th>VetName</th><th>Actions</th>
      </tr>
  `;
  records.forEach(r => {
    html += `
      <tr>
        <td>${r.RecordID ?? ""}</td>
        <td>${r.AnimalID ?? ""}</td>
        <td>${r.Date ?? ""}</td>
        <td>${r.Description ?? ""}</td>
        <td>${r.VetName ?? ""}</td>
        <td>
          <button class="edit-medical" data-id="${r.RecordID}">Edit</button>
          <button class="delete-medical" data-id="${r.RecordID}">Delete</button>
        </td>
      </tr>
    `;
  });
  html += "</table><div id='medicalFormArea'></div>";
  document.getElementById('adminContent').innerHTML = html;

  document.getElementById('addMedicalBtn').onclick = function() { renderMedicalForm(); };

  document.querySelectorAll('.edit-medical').forEach(btn => {
    btn.onclick = function() {
      const rec = records.find(r => r.RecordID == btn.getAttribute('data-id'));
      renderMedicalForm(rec);
    };
  });

  document.querySelectorAll('.delete-medical').forEach(btn => {
    btn.onclick = async function() {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this medical record?')) {
        const res = await fetch(`http://localhost:5000/api/medical/${id}`, { method: 'DELETE' });
        const result = await res.json();
        alert(result.message);
        medicalSection();
      }
    };
  });
}

function renderMedicalForm(record = {}) {
  const isEdit = !!record.RecordID;
  const area = document.getElementById('medicalFormArea');
  area.innerHTML = `
    <div style="border:1px solid #B57EDC; margin:1em 0; padding:1em;">
      <h4>${isEdit ? "Edit Medical Record" : "Add Medical Record"}</h4>
      <form id="medicalForm" novalidate>
        ${isEdit ? `<input type="hidden" name="RecordID" value="${record.RecordID}">` : ""}
        <label>AnimalID: <input type="number" id="medAnimalID" name="AnimalID" value="${record.AnimalID ?? ''}" required></label>
        <div id="animalIdError" style="color:red;font-size:0.97em;"></div>
        <label>Date (YYYY-MM-DD): <input type="date" name="Date" value="${(record.Date ?? '').slice(0,10)}" required></label><br>
        <label>Description: <input type="text" name="Description" value="${record.Description ?? ''}" required></label><br>
        <label>Vet Name: <input type="text" name="VetName" value="${record.VetName ?? ''}"></label><br>
        <button type="submit">${isEdit ? "Update" : "Add"}</button>
        <button type="button" id="cancelMedicalForm">Cancel</button>
        <div id="medicalFormMsg"></div>
      </form>
    </div>
  `;
  area.querySelector('#cancelMedicalForm').onclick = () => area.innerHTML = '';
  area.querySelector('#medicalForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const animalIdInput = document.getElementById('medAnimalID');
    const animalIdError = document.getElementById('animalIdError');
    const payload = {
      AnimalID: form.AnimalID.value,
      Date: form.Date.value,
      Description: form.Description.value,
      VetName: form.VetName.value
    };
    animalIdInput.style.border = "";
    animalIdError.textContent = "";

    let res, data;
    if (isEdit) {
      res = await fetch(`http://localhost:5000/api/medical/${record.RecordID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    } else {
      res = await fetch('http://localhost:5000/api/medical', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    }

    let isAnimalIdError = (
      !data.success &&
      (data.message.toLowerCase().includes('animal') ||
      data.message.toLowerCase().includes('foreign key') ||
      data.message.toLowerCase().includes('not present') ||
      data.message.toLowerCase().includes('not found'))
    );

    if (isAnimalIdError) {
      animalIdInput.style.border = "2px solid red";
      animalIdError.textContent = "Invalid Animal ID: This animal does not exist.";
    } else {
      animalIdInput.style.border = "";
      animalIdError.textContent = "";
    }
    area.querySelector('#medicalFormMsg').textContent = !isAnimalIdError ? data.message : "";

    if (data.success) {
      setTimeout(() => {
        area.innerHTML = '';
        medicalSection();
      }, 800);
    }
  };
}

// --------- ADOPTION APPLICATIONS MANAGEMENT --------- //
async function adoptionsSection() {
  try {
    const res = await fetch('http://localhost:5000/api/adoptions');
    const apps = await res.json();
    renderAdoptionsTable(apps);
  } catch (error) {
    document.getElementById('adminContent').innerHTML = '<div style="color: #a00;">Failed to load adoption data.</div>';
    console.error('Error loading adoption applications:', error);
  }
}

function renderAdoptionsTable(apps) {
  let html = '<h3>Manage Adoption Applications</h3>';
  if (!Array.isArray(apps) || apps.length === 0) {
    html += '<div style="color: #a00;">No data found or error loading adoption applications.</div>';
    document.getElementById('adminContent').innerHTML = html;
    return;
  }
  html += `
    <table border="1" cellpadding="4" style="min-width:900px">
      <tr>
        <th>ID</th>
        <th>Animal ID</th>
        <th>Animal Name</th>
        <th>Applicant Name</th>
        <th>Email</th>
        <th>Address</th>
        <th>Application Date</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>
  `;
  apps.forEach((a, i) => {
    const animalName = a.AnimalName || a.adoptAnimalName || '';
    const applicantAddress = a.ApplicantAddress || a.adoptAddress || '';
    const applicantName = a.ApplicantName || a.adoptName || '';
    const applicantContact = a.ApplicantContact || a.adoptContact || '';
    html += `
      <tr>
        <td>${a.ApplicationID ?? ""}</td>
        <td>${a.AnimalID ?? ""}</td>
        <td>${animalName}</td>
        <td>${applicantName}</td>
        <td>${applicantContact}</td>
        <td style="max-width: 200px; overflow-wrap: anywhere;">${applicantAddress}</td>
        <td>${a.ApplicationDate ? a.ApplicationDate.slice(0,10) : ""}</td>
        <td>${a.Status ?? ""}</td>
        <td>
          <button class="edit-adoption" data-id="${a.ApplicationID}">Edit</button>
          <button class="delete-adoption" data-id="${a.ApplicationID}">Delete</button>
        </td>
      </tr>
    `;
  });
  html += "</table><div id='adoptionsFormArea'></div>";
  document.getElementById('adminContent').innerHTML = html;

  document.querySelectorAll('.edit-adoption').forEach(btn => {
    btn.onclick = function() {
      const app = apps.find(a => a.ApplicationID == btn.getAttribute('data-id'));
      renderAdoptionForm(app);
    };
  });

  document.querySelectorAll('.delete-adoption').forEach(btn => {
    btn.onclick = async function() {
      const id = btn.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this adoption application?')) {
        const res = await fetch(`http://localhost:5000/api/adoptions/${id}`, { method: 'DELETE' });
        const result = await res.json();
        alert(result.message);
        adoptionsSection();
      }
    };
  });
}

function renderAdoptionForm(app = {}) {
  const isEdit = !!app.ApplicationID;
  const area = document.getElementById('adoptionsFormArea');
  area.innerHTML = `
    <div style="border:1px solid #B57EDC; margin:1em 0; padding:1em;">
      <h4>${isEdit ? "Edit Adoption Application" : "Add Adoption Application"}</h4>
      <form id="adoptionAdminForm">
        ${isEdit ? `<input type="hidden" name="ApplicationID" value="${app.ApplicationID}">` : ""}
        <label>Animal ID: <input type="number" id="adminAdoptAnimalID" name="AnimalID" value="${app.AnimalID ?? ''}" required></label><br>
        <label>Animal Name: <input type="text" id="adminAdoptAnimalName" name="AnimalName" value="${app.AnimalName || app.adoptAnimalName || ''}" required></label>
        <div id="adminAnimalNameError" style="color:red; font-size:0.97em; margin-bottom:0.5em;"></div>
        <label>Applicant Name: <input type="text" name="ApplicantName" value="${app.ApplicantName || app.adoptName || ''}" required></label><br>
        <label>Email: <input type="email" name="ApplicantContact" value="${app.ApplicantContact || app.adoptContact || ''}" required></label><br>
        <label>Address: <input type="text" name="ApplicantAddress" value="${app.ApplicantAddress || app.adoptAddress || ''}" required></label><br>
        <label>Status:
          <select name="Status" required>
            <option value="Pending" ${app.Status=="Pending" ? "selected" : ""}>Pending</option>
            <option value="Approved" ${app.Status=="Approved" ? "selected" : ""}>Approved</option>
            <option value="Rejected" ${app.Status=="Rejected" ? "selected" : ""}>Rejected</option>
          </select></label><br>
        <button type="submit">${isEdit ? "Update" : "Add"}</button>
        <button type="button" id="cancelAdoptionForm">Cancel</button>
        <div id="adoptionFormMsg"></div>
      </form>
    </div>
  `;
  area.querySelector('#cancelAdoptionForm').onclick = () => area.innerHTML = '';

  // Real-time Animal Name <-> ID matching (if needed)
  let animalList = [];
  fetch('http://localhost:5000/api/animals')
    .then(res => res.json())
    .then(list => { animalList = list; });

  const idInput = area.querySelector('#adminAdoptAnimalID');
  const nameInput = area.querySelector('#adminAdoptAnimalName');
  const nameError = area.querySelector('#adminAnimalNameError');

  function validateAnimalNameAndIdAdmin() {
    const idVal = idInput.value.trim();
    const nameVal = nameInput.value.trim().toLowerCase();
    const animal = animalList.find(a => (String(a.AnimalID) === idVal));
    if (!animal) {
      nameInput.style.border = "2px solid orange";
      nameError.textContent = "Animal ID not found.";
      return false;
    }
    if (animal.Name.toLowerCase() !== nameVal) {
      nameInput.style.border = "2px solid red";
      nameError.textContent = `Animal name does not match Animal ID (${animal.Name}).`;
      return false;
    }
    nameInput.style.border = "";
    nameError.textContent = "";
    return true;
  }
  idInput.addEventListener('input', () => {
    const idVal = idInput.value.trim();
    const animal = animalList.find(a => (String(a.AnimalID) === idVal));
    if (animal) {
      nameInput.value = animal.Name;
      validateAnimalNameAndIdAdmin();
    }
  });
  nameInput.addEventListener('input', validateAnimalNameAndIdAdmin);

  area.querySelector('#adoptionAdminForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateAnimalNameAndIdAdmin()) {
      area.querySelector('#adoptionFormMsg').textContent = 'Animal ID and Name must match.';
      return;
    }
    const payload = {
      AnimalID: form.AnimalID.value,
      AnimalName: form.AnimalName.value,
      ApplicantName: form.ApplicantName.value,
      ApplicantContact: form.ApplicantContact.value,
      ApplicantAddress: form.ApplicantAddress.value,
      Status: form.Status.value
    };
    let res, data;
    if (isEdit) {
      res = await fetch(`http://localhost:5000/api/adoptions/${app.ApplicationID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    }
    area.querySelector('#adoptionFormMsg').textContent = data.message;
    if (data.success) {
      setTimeout(() => {
        area.innerHTML = '';
        adoptionsSection();
      }, 800);
    }
  };
}

// --------- DONORS MANAGEMENT --------- //
async function donorsSection() {
  const res = await fetch('http://localhost:5000/api/donors');
  const donors = await res.json();
  renderDonorsTable(donors);
}

function renderDonorsTable(donors) {
  let html = '<h3>Manage Donors</h3>';
  html += `<button id="addDonorBtn">Add Donor</button>`;
  html += `
    <table border="1" cellpadding="4">
      <tr>
        <th>#</th>
        <th>DonorID</th>
        <th>Name</th>
        <th>Contact Info</th>
        <th>Actions</th>
      </tr>
  `;
  donors.forEach((d, i) => {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${d.DonorID ?? ""}</td>
        <td>${d.Name ?? ""}</td>
        <td>${d.ContactInfo ?? d.donorContact ?? ""}</td>
        <td>
          <button class="edit-donor" data-id="${d.DonorID}">Edit</button>
          <button class="delete-donor" data-id="${d.DonorID}">Delete</button>
        </td>
      </tr>
    `;
  });
  html += "</table><div id='donorFormArea'></div>";
  document.getElementById('adminContent').innerHTML = html;

  document.getElementById('addDonorBtn').onclick = function() { renderDonorForm(); };

  document.querySelectorAll('.edit-donor').forEach(btn => {
    btn.onclick = function() {
      const donor = donors.find(d => d.DonorID == btn.getAttribute('data-id'));
      renderDonorForm(donor);
    };
  });

  document.querySelectorAll('.delete-donor').forEach(btn => {
    btn.onclick = async function() {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this donor?')) {
        const res = await fetch(`http://localhost:5000/api/donors/${id}`, { method: 'DELETE' });
        const result = await res.json();
        alert(result.message);
        donorsSection();
      }
    };
  });
}

function renderDonorForm(donor = {}) {
  const isEdit = !!donor.DonorID;
  const area = document.getElementById('donorFormArea');
  area.innerHTML = `
    <div style="border:1px solid #B57EDC; margin:1em 0; padding:1em;">
      <h4>${isEdit ? "Edit Donor" : "Add Donor"}</h4>
      <form id="donorForm">
        ${isEdit ? `<input type="hidden" name="DonorID" value="${donor.DonorID}">` : ""}
        <label>Name: <input type="text" name="Name" value="${donor.Name ?? ''}" required></label><br>
        <label>Contact Info: <input type="text" name="ContactInfo" value="${donor.ContactInfo ?? donor.donorContact ?? ''}"></label><br>
        <button type="submit">${isEdit ? "Update" : "Add"}</button>
        <button type="button" id="cancelDonorForm">Cancel</button>
        <div id="donorFormMsg"></div>
      </form>
    </div>
  `;
  area.querySelector('#cancelDonorForm').onclick = () => area.innerHTML = '';
  area.querySelector('#donorForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      Name: form.Name.value,
      ContactInfo: form.ContactInfo.value
    };
    let res, data;
    if (isEdit) {
      res = await fetch(`http://localhost:5000/api/donors/${donor.DonorID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    } else {
      res = await fetch('http://localhost:5000/api/donors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    }
    area.querySelector('#donorFormMsg').textContent = data.message;
    if (data.success) {
      setTimeout(() => {
        area.innerHTML = '';
        donorsSection();
      }, 800);
    }
  };
}

// --------- DONATIONS MANAGEMENT --------- //
async function donationsSection() {
  const donorsRes = await fetch('http://localhost:5000/api/donors');
  const donors = await donorsRes.json();
  const donationsRes = await fetch('http://localhost:5000/api/donations');
  const donations = await donationsRes.json();
  renderDonationsTable(donations, donors);
}
function renderDonationsTable(donations, donors) {
  let html = '<h3>Manage Donations</h3>';
  html += `<button id="addDonationBtn">Add Donation</button>`;
  html += `
    <table border="1" cellpadding="4">
      <tr>
        <th>#</th>
        <th>DonationID</th>
        <th>Donor</th>
        <th>Contact Info</th>
        <th>Amount</th>
        <th>Date</th>
        <th>Method</th>
        <th>Actions</th>
      </tr>
  `;
  donations.forEach((d, i) => {
    const donor = donors.find(n => n.DonorID == d.DonorID);
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${d.DonationID ?? ""}</td>
        <td>${donor ? donor.Name : d.DonorID}</td>
        <td>${donor ? (donor.ContactInfo ?? donor.donorContact ?? "") : (d.ContactInfo ?? d.donorContact ?? "")}</td>
        <td>${d.Amount ?? ""}</td>
        <td>${d.Date ? d.Date.slice(0, 10) : ""}</td>
        <td>${d.Method ?? ""}</td>
        <td>
          <button class="edit-donation" data-id="${d.DonationID}">Edit</button>
          <button class="delete-donation" data-id="${d.DonationID}">Delete</button>
        </td>
      </tr>
    `;
  });
  html += "</table><div id='donationFormArea'></div>";
  document.getElementById('adminContent').innerHTML = html;

  document.getElementById('addDonationBtn').onclick = function() { renderDonationForm({}, donors); };

  document.querySelectorAll('.edit-donation').forEach(btn => {
    btn.onclick = function() {
      const donation = donations.find(d => d.DonationID == btn.getAttribute('data-id'));
      renderDonationForm(donation, donors);
    };
  });

  document.querySelectorAll('.delete-donation').forEach(btn => {
    btn.onclick = async function() {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this donation?')) {
        const res = await fetch(`http://localhost:5000/api/donations/${id}`, { method: 'DELETE' });
        const result = await res.json();
        alert(result.message);
        donationsSection();
      }
    };
  });
}
function renderDonationForm(donation = {}, donors = []) {
  const isEdit = !!donation.DonationID;
  const area = document.getElementById('donationFormArea');
  area.innerHTML = `
    <div style="border:1px solid #B57EDC; margin:1em 0; padding:1em;">
      <h4>${isEdit ? "Edit Donation" : "Add Donation"}</h4>
      <form id="donationForm">
        ${isEdit ? `<input type="hidden" name="DonationID" value="${donation.DonationID}">` : ""}
        <label>Donor:
          <select name="DonorID" required>
            <option value="">Select</option>
            ${donors.map(d => `<option value="${d.DonorID}" ${donation.DonorID == d.DonorID ? "selected" : ""}>${d.Name}</option>`).join('')}
          </select>
        </label><br>
        <label>Contact Info: <input type="text" name="ContactInfo" value="${donation.ContactInfo ?? donation.donorContact ?? ''}"></label><br>
        <label>Amount: <input type="number" name="Amount" step="any" value="${donation.Amount ?? ''}" required></label><br>
        <label>Date: <input type="date" name="Date" value="${donation.Date ? donation.Date.slice(0,10) : ''}"></label><br>
        <label>Method: <input type="text" name="Method" value="${donation.Method ?? ''}"></label><br>
        <button type="submit">${isEdit ? "Update" : "Add"}</button>
        <button type="button" id="cancelDonationForm">Cancel</button>
        <div id="donationFormMsg"></div>
      </form>
    </div>
  `;
  area.querySelector('#cancelDonationForm').onclick = () => area.innerHTML = '';
  area.querySelector('#donationForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      DonorID: form.DonorID.value,
      ContactInfo: form.ContactInfo.value,
      Amount: form.Amount.value,
      Date: form.Date.value,
      Method: form.Method.value
    };
    let res, data;
    if (isEdit) {
      res = await fetch(`http://localhost:5000/api/donations/${donation.DonationID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    } else {
      res = await fetch('http://localhost:5000/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    }
    area.querySelector('#donationFormMsg').textContent = data.message;
    if (data.success) {
      setTimeout(() => {
        area.innerHTML = '';
        donationsSection();
      }, 800);
    }
  };
}

// --------- VOLUNTEERS MANAGEMENT --------- //
async function volunteersSection() {
  const res = await fetch('http://localhost:5000/api/volunteers');
  const volunteers = await res.json();
  renderVolunteersTable(volunteers);
}

function renderVolunteersTable(vols) {
  let html = '<h3>Manage Volunteers</h3>';
  html += `<button id="addVolunteerBtn">Add Volunteer</button>`;
  html += `
    <table border="1" cellpadding="4">
      <tr>
        <th>#</th>
        <th>VolunteerID</th>
        <th>Name</th>
        <th>ContactInfo</th>
        <th>JoinDate</th>
        <th>AssignedTasks</th>
        <th>Actions</th>
      </tr>
  `;
  vols.forEach((v, i) => {
    html += `
      <tr>
        <td>${i + 1}</td>
        <td>${v.VolunteerID ?? ""}</td>
        <td>${v.Name ?? ""}</td>
        <td>${v.ContactInfo ?? ""}</td>
        <td>${v.JoinDate ? v.JoinDate.slice(0,10) : ""}</td>
        <td>${v.AssignedTasks ?? ""}</td>
        <td>
          <button class="edit-volunteer" data-id="${v.VolunteerID}">Edit</button>
          <button class="delete-volunteer" data-id="${v.VolunteerID}">Delete</button>
        </td>
      </tr>
    `;
  });
  html += "</table><div id='volunteerFormArea'></div>";
  document.getElementById('adminContent').innerHTML = html;

  document.getElementById('addVolunteerBtn').onclick = function() { renderVolunteerForm(); };

  document.querySelectorAll('.edit-volunteer').forEach(btn => {
    btn.onclick = function() {
      const vol = vols.find(v => v.VolunteerID == btn.getAttribute('data-id'));
      renderVolunteerForm(vol);
    };
  });

  document.querySelectorAll('.delete-volunteer').forEach(btn => {
    btn.onclick = async function() {
      const id = btn.getAttribute('data-id');
      if (confirm('Delete this volunteer?')) {
        const res = await fetch(`http://localhost:5000/api/volunteers/${id}`, { method: 'DELETE' });
        const result = await res.json();
        alert(result.message);
        volunteersSection();
      }
    };
  });
}

function renderVolunteerForm(vol = {}) {
  const isEdit = !!vol.VolunteerID;
  const area = document.getElementById('volunteerFormArea');
  area.innerHTML = `
    <div style="border:1px solid #B57EDC; margin:1em 0; padding:1em;">
      <h4>${isEdit ? "Edit Volunteer" : "Add Volunteer"}</h4>
      <form id="volunteerForm">
        ${isEdit ? `<input type="hidden" name="VolunteerID" value="${vol.VolunteerID}">` : ""}
        <label>Name: <input type="text" name="Name" value="${vol.Name ?? ''}" required></label><br>
        <label>Contact Info: <input type="text" name="ContactInfo" value="${vol.ContactInfo ?? ''}"></label><br>
        <label>Join Date: <input type="date" name="JoinDate" value="${vol.JoinDate ? vol.JoinDate.slice(0,10) : ''}"></label><br>
        <label>Assigned Tasks: <input type="text" name="AssignedTasks" value="${vol.AssignedTasks ?? ''}"></label><br>
        <button type="submit">${isEdit ? "Update" : "Add"}</button>
        <button type="button" id="cancelVolunteerForm">Cancel</button>
        <div id="volunteerFormMsg"></div>
      </form>
    </div>
  `;
  area.querySelector('#cancelVolunteerForm').onclick = () => area.innerHTML = '';
  area.querySelector('#volunteerForm').onsubmit = async function(e) {
    e.preventDefault();
    const form = e.target;
    const payload = {
      Name: form.Name.value,
      ContactInfo: form.ContactInfo.value,
      JoinDate: form.JoinDate.value,
      AssignedTasks: form.AssignedTasks.value
    };
    let res, data;
    if (isEdit) {
      res = await fetch(`http://localhost:5000/api/volunteers/${vol.VolunteerID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    } else {
      res = await fetch('http://localhost:5000/api/volunteers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      data = await res.json();
    }
    area.querySelector('#volunteerFormMsg').textContent = data.message;
    if (data.success) {
      setTimeout(() => {
        area.innerHTML = '';
        volunteersSection();
      }, 800);
    }
  };
}
