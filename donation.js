document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('donationForm');
  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const responseDiv = document.getElementById('donationResponse');
    const payload = {
      donorName: form.donorName.value,
      donorContact: form.donorContact.value,
      donationAmount: form.donationAmount.value
    };
    try {
      const res = await fetch('http://localhost:5000/api/donations', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      responseDiv.textContent = data.message || 'No server message.';
      if (data.success) form.reset();
    } catch (err) {
      responseDiv.textContent = 'Submission failed. Please try again later.';
    }
  });
});