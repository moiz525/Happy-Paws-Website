/**
 * Animal Manager - Helper functions for animal database operations
 */

// Cache for animal data
let animalCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 1 minute in milliseconds

/**
 * Fetch all animals from the API with caching
 * @param {boolean} forceRefresh Force a fresh fetch from the server
 * @returns {Promise<Array>} Array of animal objects
 */
async function fetchAnimals(forceRefresh = false) {
  const now = Date.now();

  // Always force refresh when called from the home page
  if (window.location.pathname.endsWith('index.html') || forceRefresh) {
    console.log('Forcing refresh of animal data for home page or by request');
    animalCache = null;
    lastFetchTime = 0;
    forceRefresh = true;
  }

  // Return cached data if not expired and not forcing refresh
  if (!forceRefresh && animalCache && (now - lastFetchTime < CACHE_TTL)) {
    console.log('Using cached animal data');
    return animalCache;
  }

  try {
    console.log('Fetching fresh animal data from API');
    const response = await fetch('http://localhost:5000/api/animals');
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const animals = await response.json();
    console.log('Fetched animals:', animals); // Debug log to see what's coming from the API

    // Process animals to ensure consistent image URL field
    animals.forEach(animal => {
      // Ensure ImageURL is set to a valid value from any of the potential fields
      animal.ImageURL = animal.ImageURL || animal.imageURL || animal.SampleImageURL || null;

      // Ensure lowercase imageURL is also set for backward compatibility
      animal.imageURL = animal.ImageURL;

      // Set SampleImageURL for compatibility
      animal.SampleImageURL = animal.ImageURL;
    });

    animalCache = animals;
    lastFetchTime = now;
    return animals;
  } catch (error) {
    console.error('Error fetching animals:', error);
    // If cache exists, return it even if expired
    if (animalCache) {
      return animalCache;
    }
    // Otherwise, throw the error up
    throw error;
  }
}

/**
 * Get a single animal by ID
 * @param {number|string} id The animal ID to find
 * @returns {Promise<Object|null>} The animal object or null if not found
 */
async function getAnimalById(id) {
  try {
    const animals = await fetchAnimals();
    return animals.find(animal => String(animal.AnimalID) === String(id)) || null;
  } catch (error) {
    console.error('Error getting animal by ID:', error);
    return null;
  }
}

/**
 * Get featured animals for the homepage
 * @param {number} limit Maximum number of animals to return
 * @returns {Promise<Array>} Array of featured animals
 */
async function getFeaturedAnimals(limit = 5) {
  try {
    const animals = await fetchAnimals();
    // First try to get animals explicitly marked as featured
    let featured = animals.filter(animal => animal.Featured);

    // If we don't have enough featured animals, add available ones up to the limit
    if (featured.length < limit) {
      const available = animals.filter(
        animal => animal.Status === 'Available' && !animal.Featured
      );
      featured = [...featured, ...available.slice(0, limit - featured.length)];
    }

    // Limit to requested number
    return featured.slice(0, limit);
  } catch (error) {
    console.error('Error getting featured animals:', error);
    return [];
  }
}

/**
 * Create an HTML animal card element
 * @param {Object} animal The animal data object
 * @param {boolean} detailed Whether to show detailed information
 * @returns {HTMLElement} The animal card DOM element
 */
function createAnimalCard(animal, detailed = false) {
  console.log('Creating card for animal:', animal); // Debug log to see what data we're using

  const card = document.createElement('div');
  card.className = 'animal-card adv-animal-card';
  if (animal.Featured) {
    card.classList.add('featured');

    const featuredBadge = document.createElement('div');
    featuredBadge.className = 'featured-badge';
    featuredBadge.textContent = 'Featured';
    card.appendChild(featuredBadge);
  }
  card.dataset.animalId = animal.AnimalID;

  // Image has been removed

  const name = document.createElement('div');
  name.className = 'animal-name adv-animal-name';
  name.textContent = animal.Name;

  const type = document.createElement('div');
  type.className = 'animal-type adv-animal-type';
  type.textContent = animal.Species || 'Unknown';

  if (animal.Breed) {
    type.textContent += ` (${animal.Breed})`;
  }

  const desc = document.createElement('div');
  desc.className = 'animal-desc adv-animal-desc';

  // Check various ways the description might be stored in the API response
  const description = animal.Description || animal.description || animal.desc || null;
  console.log('Description field value:', description); // Debug log for description

  if (description) {
    desc.textContent = description;
  } else {
    // Generate a default description if none is provided
    desc.textContent = `A lovely ${animal.Species ? animal.Species.toLowerCase() : 'pet'} looking for a forever home.`;
  }

  // Add more details if requested
  if (detailed) {
    const details = document.createElement('div');
    details.className = 'animal-details';
    details.innerHTML = `
      <p><strong>Age:</strong> ${animal.Age || 'Unknown'}</p>
      <p><strong>Gender:</strong> ${animal.Gender || 'Unknown'}</p>
      <p><strong>Status:</strong> ${animal.Status || 'Unknown'}</p>
    `;
    card.appendChild(details);
  }

  const btn = document.createElement('a');
  btn.className = 'adopt-btn adv-adopt-btn';
  btn.href = `adoption.html?id=${animal.AnimalID}&name=${encodeURIComponent(animal.Name)}`;
  btn.textContent = 'Adopt Me';

  card.appendChild(name);
  card.appendChild(type);
  card.appendChild(desc);
  card.appendChild(btn);
  return card;
}

window.AnimalManager = {
  fetchAnimals,
  getAnimalById,
  getFeaturedAnimals,
  createAnimalCard,
  // Improved clearCache function that also clears browser cache for images
  clearCache: function() {
    console.log('Clearing animal cache to ensure fresh data');
    animalCache = null;
    lastFetchTime = 0;
    return true; // Return true to confirm cache was cleared
  },
  // Add a getter for direct access to check if cache exists
  isCacheEmpty: function() {
    return animalCache === null;
  }
};
