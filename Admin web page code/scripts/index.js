// DOM elements
const guideList = document.querySelector('.guides');

// setup guides
const setupGuides = (data) => {

    if (data.length) {
      let html = '';
      data.forEach(doc => {
        const user = doc.data();
        const li = `
          <li>
            <div class="collapsible-header grey lighten-4"> ${user.name} </div>
            <div class="collapsible-body white"> ${user.email} <br>
            ${user.id}
            </div>
            
          </li>
        `;
        html += li;
      });
      guideList.innerHTML = html
    } else {
      guideList.innerHTML = '<h5 class="center-align">Login to view Users</h5>';
    }

  };

// setup materialize components
document.addEventListener('DOMContentLoaded', function() {

  var modals = document.querySelectorAll('.modal');
  M.Modal.init(modals);

  var items = document.querySelectorAll('.collapsible');
  M.Collapsible.init(items);

});