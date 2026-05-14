// ============================================================
// app.js - Tầng Controller/View: Điều khiển giao diện
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  const auth = AccountManager.getInstance();

  // ===== LOGIN PARTICLES ANIMATION =====
  function createParticles() {
    const container = document.getElementById('login-particles');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const p = document.createElement('div');
      p.className = 'login-particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.animationDuration = (4 + Math.random() * 6) + 's';
      p.style.animationDelay = Math.random() * 6 + 's';
      p.style.width = p.style.height = (2 + Math.random() * 3) + 'px';
      const colors = ['rgba(99,102,241,0.5)','rgba(139,92,246,0.5)','rgba(236,72,153,0.4)','rgba(168,85,247,0.4)'];
      p.style.background = colors[Math.floor(Math.random()*colors.length)];
      container.appendChild(p);
    }
  }
  createParticles();

  // ===== TOGGLE PASSWORD VISIBILITY =====
  document.getElementById('toggle-password').addEventListener('click', () => {
    const pwdInput = document.getElementById('login-password');
    const btn = document.getElementById('toggle-password');
    if (pwdInput.type === 'password') {
      pwdInput.type = 'text';
      btn.textContent = '🙈';
    } else {
      pwdInput.type = 'password';
      btn.textContent = '👁️';
    }
  });

  // ===== ACCOUNT CHIP QUICK-FILL =====
  document.querySelectorAll('.account-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('login-username').value = chip.dataset.user;
      document.getElementById('login-password').value = chip.dataset.pass;
      // Visual feedback
      document.querySelectorAll('.account-chip').forEach(c => c.style.borderColor = '');
      chip.style.borderColor = 'var(--accent)';
    });
  });

  // ===== LOGIN FORM =====
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');

    // Show loading
    loginBtn.classList.add('loading');
    loginError.classList.remove('show');

    // Simulate slight delay for UX
    setTimeout(() => {
      try {
        const user = auth.login(username, password);
        // Success - transition to app
        document.getElementById('login-screen').style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => {
          document.getElementById('login-screen').classList.add('hidden');
          document.getElementById('app-wrapper').style.display = 'flex';
          initApp(user);
        }, 400);
      } catch (err) {
        loginError.innerHTML = `❌ ${err.message}`;
        loginError.classList.add('show');
        loginBtn.classList.remove('loading');
        // Shake the card
        const card = document.querySelector('.login-card');
        card.style.animation = 'none';
        card.offsetHeight; // trigger reflow
        card.style.animation = 'shakeError 0.4s ease';
      }
    }, 600);
  });

  // ===== CHECK EXISTING SESSION =====
  const existingUser = auth.restoreSession();
  if (existingUser) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-wrapper').style.display = 'flex';
    initApp(existingUser);
  }

  // ===== MAIN APP INITIALIZATION =====
  function initApp(currentUser) {
  const mgr = CinemaManager.getInstance();
  let selectedShowtime = null, selectedSeats = [], currentRoom = null;
  // ===== NAVIGATION =====
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const section = item.dataset.section;
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + section).classList.add('active');
      if (section === 'dashboard') renderDashboard();
      if (section === 'movies') renderMovies();
      if (section === 'showtimes') renderShowtimes();
      if (section === 'booking') renderBookingStep1();
      if (section === 'rooms') renderRooms();
      if (section === 'customers') renderCustomers();
      if (section === 'revenue') renderRevenue();
      if (section === 'accounts') renderAccounts();
    });
  });

  // ===== CLOCK =====
  const updateClock = () => {
    const now = new Date();
    document.getElementById('current-time').textContent = now.toLocaleTimeString('vi-VN');
  };
  setInterval(updateClock, 1000); updateClock();

  // ===== MOBILE MENU =====
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });

  // ===== GLOBAL SEARCH (tìm tất cả: phim, khách hàng, vé, ID) =====
  const searchDropdown = document.getElementById('search-results-dropdown');
  document.getElementById('global-search').addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    if (!query) { searchDropdown.classList.remove('show'); return; }
    let html = '';
    // Tìm phim
    const movies = mgr.movies.filter(m => m.title.toLowerCase().includes(query) || m.genre.toLowerCase().includes(query) || (m.director && m.director.toLowerCase().includes(query)));
    if (movies.length) {
      html += '<div class="search-category">🎬 Phim</div>';
      movies.forEach(m => { html += `<div class="search-result-item" data-action="movie" data-id="${m.id}"><span class="sr-icon">🎥</span><div class="sr-info"><p>${m.title}</p><small>${m.genre} • ${m.duration} phút • ${m.director||'N/A'}</small></div></div>`; });
    }
    // Tìm khách hàng
    const custs = mgr.customers.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query) || (c.email && c.email.toLowerCase().includes(query)) || c.id.toLowerCase().includes(query));
    if (custs.length) {
      html += '<div class="search-category">👥 Khách hàng</div>';
      custs.forEach(c => { html += `<div class="search-result-item" data-action="customer"><span class="sr-icon">👤</span><div class="sr-info"><p>${c.name}</p><small>SĐT: ${c.phone} • ${c.getTypeName()} • ID: ${c.id.slice(0,8)}</small></div></div>`; });
    }
    // Tìm vé
    const tickets = mgr.tickets.filter(t => t.id.toLowerCase().includes(query) || t.seatLabels.some(l => l.toLowerCase().includes(query)));
    if (tickets.length) {
      html += '<div class="search-category">🎫 Vé</div>';
      tickets.forEach(t => {
        const st = mgr.findShowtime(t.showtimeId); const mv = st ? mgr.findMovie(st.movieId) : null;
        html += `<div class="search-result-item" data-action="ticket"><span class="sr-icon">🎫</span><div class="sr-info"><p>${mv?mv.title:'N/A'} - Ghế: ${t.seatLabels.join(', ')}</p><small>Mã: ${t.id.slice(0,8)} • ${fmt(t.totalPrice)}</small></div></div>`;
      });
    }
    // Tìm lịch chiếu
    const shows = mgr.showtimes.filter(s => { const m = mgr.findMovie(s.movieId); return m && m.title.toLowerCase().includes(query) || s.date.includes(query); });
    if (shows.length) {
      html += '<div class="search-category">🕐 Lịch chiếu</div>';
      shows.forEach(s => { const m = mgr.findMovie(s.movieId); const r = mgr.findRoom(s.roomId); html += `<div class="search-result-item" data-action="showtime"><span class="sr-icon">🕐</span><div class="sr-info"><p>${m?m.title:'N/A'}</p><small>${r?r.name:'N/A'} • ${s.date} ${s.time} • ${fmt(s.basePrice)}</small></div></div>`; });
    }
    if (!html) html = '<p class="notif-empty">Không tìm thấy kết quả cho "'+query+'"</p>';
    searchDropdown.innerHTML = html;
    searchDropdown.classList.add('show');
    // Click to navigate
    searchDropdown.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        searchDropdown.classList.remove('show');
        document.getElementById('global-search').value = '';
        const navMap = {movie:'movies',customer:'customers',ticket:'revenue',showtime:'showtimes'};
        if (navMap[action]) { document.getElementById('nav-'+navMap[action]).click(); }
      });
    });
  });
  // Close search dropdown on outside click
  document.addEventListener('click', e => {
    if (!e.target.closest('.search-bar')) searchDropdown.classList.remove('show');
  });

  // ===== TOAST =====
  function showToast(msg, type = 'success') {
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type]}</span><span class="toast-msg">${msg}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  }

  // ===== FORMAT =====
  const fmt = n => new Intl.NumberFormat('vi-VN').format(n) + '₫';

  // ===== DASHBOARD =====
  function renderDashboard() {
    document.getElementById('stat-total-movies').textContent = mgr.movies.length;
    document.getElementById('stat-total-tickets').textContent = mgr.getTotalSeatsSold();
    document.getElementById('stat-total-revenue').textContent = fmt(mgr.getTotalRevenue());
    document.getElementById('stat-total-customers').textContent = mgr.customers.length;
    // Recent bookings
    const rbList = document.getElementById('recent-bookings-list');
    const recent = mgr.tickets.slice(-5).reverse();
    rbList.innerHTML = recent.length ? recent.map(t => {
      const st = mgr.findShowtime(t.showtimeId);
      const mv = st ? mgr.findMovie(st.movieId) : null;
      const cust = mgr.findCustomer(t.customerId);
      return `<div class="booking-item"><div class="booking-item-icon">🎫</div><div class="booking-item-info"><h4>${mv ? mv.title : 'N/A'}</h4><p>${cust ? cust.name : 'N/A'} • ${t.seatLabels.join(', ')}</p></div><span class="booking-item-price">${fmt(t.totalPrice)}</span></div>`;
    }).join('') : '<p style="color:var(--text-muted);padding:1rem">Chưa có đặt vé nào</p>';
    // Popular movies
    const pmList = document.getElementById('popular-movies-list');
    const movieStats = mgr.movies.map(m => ({movie: m, rev: mgr.getRevenueByMovie(m.id)})).sort((a,b) => b.rev - a.rev).slice(0,5);
    pmList.innerHTML = movieStats.map((ms, i) => `<div class="popular-item"><span class="popular-rank">${i+1}</span><div class="popular-info"><h4>${ms.movie.title}</h4><p>${ms.movie.genre}</p></div><span class="popular-tickets">${fmt(ms.rev)}</span></div>`).join('');
  }

  // ===== MOVIES =====
  function renderMovies(searchQuery = '') {
    const grid = document.getElementById('movies-grid');
    const emojis = {'Hành động':'💥','Tình cảm':'💕','Kinh dị':'👻','Hài':'😂','Viễn tưởng':'🚀','Hoạt hình':'🎨','Tài liệu':'📹'};
    let movies = mgr.movies;
    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      movies = movies.filter(m =>
        m.title.toLowerCase().includes(searchQuery) ||
        m.genre.toLowerCase().includes(searchQuery) ||
        (m.director && m.director.toLowerCase().includes(searchQuery))
      );
    }
    if (movies.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--text-muted)">
        <p style="font-size:3rem;margin-bottom:1rem">🎬</p>
        <p>${searchQuery ? 'Không tìm thấy phim phù hợp với "'+searchQuery+'"' : 'Chưa có phim nào. Hãy thêm phim mới!'}</p>
      </div>`;
      return;
    }
    grid.innerHTML = movies.map(m => `
      <div class="movie-card" data-movie-id="${m.id}">
        <div class="movie-poster">${emojis[m.genre] || '🎬'}</div>
        <div class="movie-info">
          <h3>${m.title}</h3>
          <div class="movie-meta">
            <span class="movie-badge">${m.genre}</span>
            <span class="movie-badge duration">${m.duration} phút</span>
            ${m.rating ? `<span class="movie-rating">⭐ ${m.rating}</span>` : ''}
          </div>
          <p style="font-size:0.8rem;color:var(--text-secondary)">${m.description || ''}</p>
          <p style="font-size:0.8rem;color:var(--text-muted);margin-top:0.3rem">🎬 ${m.director || 'N/A'}</p>
          <div class="movie-actions">
            <button class="btn btn-sm btn-secondary btn-edit-movie" data-id="${m.id}">✏️ Sửa</button>
            <button class="btn btn-sm btn-danger btn-delete-movie" data-id="${m.id}">🗑️ Xóa</button>
          </div>
        </div>
      </div>`).join('');
    // Event delegation cho nút Sửa/Xóa
    grid.querySelectorAll('.btn-edit-movie').forEach(btn => {
      btn.addEventListener('click', () => openEditMovie(btn.dataset.id));
    });
    grid.querySelectorAll('.btn-delete-movie').forEach(btn => {
      btn.addEventListener('click', () => handleDeleteMovie(btn.dataset.id));
    });
  }

  // Movie Modal
  const movieModal = document.getElementById('movie-modal');
  document.getElementById('btn-add-movie').addEventListener('click', () => {
    document.getElementById('movie-form').reset();
    document.getElementById('movie-edit-id').value = '';
    document.getElementById('movie-modal-title').textContent = 'Thêm Phim Mới';
    movieModal.classList.add('show');
  });
  document.getElementById('movie-modal-close').addEventListener('click', () => movieModal.classList.remove('show'));
  document.getElementById('movie-cancel').addEventListener('click', () => movieModal.classList.remove('show'));

  document.getElementById('movie-form').addEventListener('submit', e => {
    e.preventDefault();
    try {
      const data = {
        title: document.getElementById('movie-title').value,
        genre: document.getElementById('movie-genre').value,
        duration: parseInt(document.getElementById('movie-duration').value),
        director: document.getElementById('movie-director').value,
        rating: parseFloat(document.getElementById('movie-rating').value) || 0,
        description: document.getElementById('movie-description').value,
        poster: document.getElementById('movie-poster').value
      };
      const editId = document.getElementById('movie-edit-id').value;
      if (editId) {
        mgr.updateMovie(editId, data);
        showToast('Cập nhật phim thành công!');
        movieModal.classList.remove('show');
        renderMovies(); renderDashboard();
      } else {
        const newMovie = mgr.addMovie(data);
        addNotification('🎬', `Phim "${data.title}" đã được thêm vào hệ thống`);
        movieModal.classList.remove('show');
        renderMovies(); renderDashboard();
        // Hỏi tạo lịch chiếu cho phim mới
        if (confirm(`Đã thêm phim "${data.title}" thành công!\n\nBạn có muốn tạo lịch chiếu cho phim này ngay không?`)) {
          // Mở modal lịch chiếu với phim đã chọn sẵn
          const mSel = document.getElementById('showtime-movie');
          mSel.innerHTML = mgr.movies.map(m => `<option value="${m.id}" ${m.id===newMovie.id?'selected':''}>${m.title}</option>`).join('');
          const rSel = document.getElementById('showtime-room');
          rSel.innerHTML = mgr.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
          document.getElementById('showtime-form').reset();
          document.getElementById('showtime-movie').value = newMovie.id;
          document.getElementById('showtime-date').value = new Date().toISOString().split('T')[0];
          document.getElementById('showtime-modal').classList.add('show');
          // Switch to showtimes nav
          document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
          document.getElementById('nav-showtimes').classList.add('active');
          document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
          document.getElementById('section-showtimes').classList.add('active');
          renderShowtimes();
        }
      }
    } catch (err) { showToast(err.message, 'error'); }
  });

  function openEditMovie(id) {
    const m = mgr.findMovie(id);
    if (!m) { showToast('Không tìm thấy phim!', 'error'); return; }
    document.getElementById('movie-edit-id').value = id;
    document.getElementById('movie-title').value = m.title;
    document.getElementById('movie-genre').value = m.genre;
    document.getElementById('movie-duration').value = m.duration;
    document.getElementById('movie-director').value = m.director || '';
    document.getElementById('movie-rating').value = m.rating || '';
    document.getElementById('movie-description').value = m.description || '';
    document.getElementById('movie-poster').value = m.poster || '';
    document.getElementById('movie-modal-title').textContent = 'Chỉnh Sửa Phim';
    movieModal.classList.add('show');
  }
  function handleDeleteMovie(id) {
    const m = mgr.findMovie(id);
    if (!m) { showToast('Không tìm thấy phim!', 'error'); return; }
    if (confirm(`Bạn có chắc muốn xóa phim "${m.title}"?`)) {
      mgr.deleteMovie(id);
      showToast(`Đã xóa phim "${m.title}"!`, 'info');
      renderMovies(); renderDashboard();
    }
  }
  // Also expose globally for any inline usage
  window.editMovie = openEditMovie;
  window.deleteMovie = handleDeleteMovie;

  // ===== SHOWTIMES =====
  function renderShowtimes() {
    const tbody = document.getElementById('showtime-tbody');
    tbody.innerHTML = mgr.showtimes.map(s => {
      const m = mgr.findMovie(s.movieId);
      const r = mgr.findRoom(s.roomId);
      return `<tr>
        <td>${m ? m.title : 'N/A'}</td><td>${r ? r.name : 'N/A'}</td>
        <td>${s.date}</td><td>${s.time}</td><td>${fmt(s.basePrice)}</td>
        <td><span class="status-badge ${s.bookedSeats.length > 50 ? 'status-full' : 'status-active'}">${s.status}</span></td>
        <td><button class="btn btn-sm btn-danger btn-delete-showtime" data-id="${s.id}">🗑️</button></td>
      </tr>`;
    }).join('');
    // Event delegation for showtime delete
    tbody.querySelectorAll('.btn-delete-showtime').forEach(btn => {
      btn.addEventListener('click', () => {
        if(confirm('Xóa lịch chiếu này?')) {
          mgr.deleteShowtime(btn.dataset.id);
          showToast('Đã xóa lịch chiếu!','info');
          renderShowtimes();
        }
      });
    });
  }

  // Showtime Modal
  const stModal = document.getElementById('showtime-modal');
  document.getElementById('btn-add-showtime').addEventListener('click', () => {
    const mSel = document.getElementById('showtime-movie');
    mSel.innerHTML = mgr.movies.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
    const rSel = document.getElementById('showtime-room');
    rSel.innerHTML = mgr.rooms.map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    document.getElementById('showtime-form').reset();
    stModal.classList.add('show');
  });
  document.getElementById('showtime-modal-close').addEventListener('click', () => stModal.classList.remove('show'));
  document.getElementById('showtime-cancel').addEventListener('click', () => stModal.classList.remove('show'));
  document.getElementById('showtime-form').addEventListener('submit', e => {
    e.preventDefault();
    try {
      mgr.addShowtime({
        movieId: document.getElementById('showtime-movie').value,
        roomId: document.getElementById('showtime-room').value,
        date: document.getElementById('showtime-date').value,
        time: document.getElementById('showtime-time').value,
        basePrice: parseInt(document.getElementById('showtime-price').value)
      });
      showToast('Thêm lịch chiếu thành công!');
      stModal.classList.remove('show'); renderShowtimes();
    } catch(err) { showToast(err.message, 'error'); }
  });
  window.deleteShowtime = function(id) {
    if(confirm('Xóa lịch chiếu này?')) { mgr.deleteShowtime(id); showToast('Đã xóa!','info'); renderShowtimes(); }
  };

  // ===== BOOKING =====
  function showStep(n) {
    [1,2,3,4].forEach(i => document.getElementById('booking-step-'+i).classList.toggle('hidden', i!==n));
  }

  function renderBookingStep1() {
    showStep(1); selectedShowtime = null; selectedSeats = [];
    const container = document.getElementById('booking-showtimes');
    container.innerHTML = mgr.showtimes.map(s => {
      const m = mgr.findMovie(s.movieId);
      const r = mgr.findRoom(s.roomId);
      return `<div class="showtime-card" data-id="${s.id}">
        <h3>${m ? m.title : 'N/A'}</h3>
        <p>🏛️ ${r ? r.name : 'N/A'}</p>
        <p>📅 ${s.date} • 🕐 ${s.time}</p>
        <p>💰 ${fmt(s.basePrice)}</p>
        <p><span class="status-badge status-active">${s.status}</span></p>
      </div>`;
    }).join('');
    container.querySelectorAll('.showtime-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.showtime-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        selectedShowtime = mgr.findShowtime(card.dataset.id);
        currentRoom = mgr.findRoom(selectedShowtime.roomId);
        setTimeout(() => { showStep(2); renderSeatMap(); }, 300);
      });
    });
  }

  function renderSeatMap() {
    selectedSeats = [];
    const map = document.getElementById('seat-map');
    const seats = currentRoom.seats;
    const rows = {};
    seats.forEach(s => { if(!rows[s.row]) rows[s.row]=[]; rows[s.row].push(s); });
    map.innerHTML = '';
    Object.keys(rows).sort().forEach(rowLabel => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'seat-row';
      rowDiv.innerHTML = `<span class="seat-row-label">${rowLabel}</span>`;
      rows[rowLabel].sort((a,b) => a.number - b.number).forEach(seat => {
        const btn = document.createElement('button');
        const booked = selectedShowtime.isSeatBooked(seat.label);
        btn.className = `seat ${seat.type}${booked ? ' occupied' : ''}`;
        btn.textContent = seat.number;
        btn.disabled = booked;
        btn.dataset.label = seat.label;
        btn.dataset.type = seat.type;
        if(!booked) {
          btn.addEventListener('click', () => {
            btn.classList.toggle('selected');
            if(btn.classList.contains('selected')) selectedSeats.push(seat);
            else selectedSeats = selectedSeats.filter(s => s.label !== seat.label);
            updateBookingSummary();
          });
        }
        rowDiv.appendChild(btn);
      });
      map.appendChild(rowDiv);
    });
    updateBookingSummary();
  }

  function updateBookingSummary() {
    document.getElementById('selected-seats-display').textContent =
      selectedSeats.length ? selectedSeats.map(s => s.label).join(', ') : 'Chưa chọn';
    const total = selectedSeats.reduce((sum, s) => sum + s.calculatePrice(selectedShowtime.basePrice), 0);
    document.getElementById('total-price-display').textContent = fmt(total);
    // Show step 3 button
    const summary = document.getElementById('booking-summary');
    let nextBtn = summary.querySelector('.btn-primary');
    if(!nextBtn && selectedSeats.length) {
      nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary';
      nextBtn.style.marginTop = '1rem'; nextBtn.style.width = '100%';
      nextBtn.textContent = 'Tiếp tục →';
      nextBtn.addEventListener('click', () => showStep(3));
      summary.appendChild(nextBtn);
    }
    if(nextBtn) nextBtn.style.display = selectedSeats.length ? 'block' : 'none';
  }

  document.getElementById('booking-back').addEventListener('click', () => { showStep(2); renderSeatMap(); });

  document.getElementById('customer-booking-form').addEventListener('submit', e => {
    e.preventDefault();
    try {
      const result = mgr.bookTicket({
        showtimeId: selectedShowtime.id,
        customerType: document.getElementById('cust-type').value,
        customerData: {
          name: document.getElementById('cust-name').value,
          phone: document.getElementById('cust-phone').value,
          email: document.getElementById('cust-email').value
        },
        seatLabels: selectedSeats.map(s => s.label),
        room: currentRoom
      });
      // Show ticket
      const mv = mgr.findMovie(selectedShowtime.movieId);
      document.getElementById('ticket-preview').innerHTML = `
        <h3>🎬 VÉ XEM PHIM</h3>
        <div class="ticket-row"><span>Mã vé:</span><span>${result.ticket.id}</span></div>
        <div class="ticket-row"><span>Phim:</span><span>${mv ? mv.title : 'N/A'}</span></div>
        <div class="ticket-row"><span>Ngày:</span><span>${selectedShowtime.date}</span></div>
        <div class="ticket-row"><span>Giờ:</span><span>${selectedShowtime.time}</span></div>
        <div class="ticket-row"><span>Ghế:</span><span>${result.ticket.seatLabels.join(', ')}</span></div>
        <div class="ticket-row"><span>Khách hàng:</span><span>${result.customer.name} (${result.customer.getTypeName()})</span></div>
        <div class="ticket-row"><span>Giảm giá:</span><span>${result.customer.getDiscount()*100}%</span></div>
        <div class="ticket-row"><span>Số vé (ghế):</span><span>${result.ticket.seatLabels.length} vé</span></div>
        <div class="ticket-row" style="font-size:1.1rem;font-weight:700;color:var(--accent-light)"><span>Tổng tiền:</span><span>${fmt(result.ticket.totalPrice)}</span></div>`;
      showStep(4);
      showToast(`Đặt ${result.ticket.seatLabels.length} vé thành công!`);
      addNotification('🎫', `${result.customer.name} đặt ${result.ticket.seatLabels.length} vé xem "${mv?mv.title:'N/A'}" - ${fmt(result.ticket.totalPrice)}`);
      renderDashboard();
    } catch(err) { showToast(err.message, 'error'); }
  });

  document.getElementById('booking-new').addEventListener('click', renderBookingStep1);

  // ===== ROOMS =====
  function renderRooms() {
    const grid = document.getElementById('rooms-grid');
    grid.innerHTML = mgr.rooms.map(r => {
      // Đếm số lịch chiếu của phòng này
      const showtimeCount = mgr.showtimes.filter(s => s.roomId === r.id).length;
      return `
      <div class="room-card" data-room-id="${r.id}">
        <h3>🏛️ ${r.name}</h3>
        <div class="room-detail"><span>Tổng ghế:</span><span>${r.totalSeats}</span></div>
        <div class="room-detail"><span>Ghế thường:</span><span>${r.seats.filter(s=>s.type==='normal').length}</span></div>
        <div class="room-detail"><span>Ghế VIP:</span><span>${r.seats.filter(s=>s.type==='vip').length}</span></div>
        <div class="room-detail"><span>Ghế Couple:</span><span>${r.seats.filter(s=>s.type==='couple').length}</span></div>
        <div class="room-detail"><span>Số lịch chiếu:</span><span>${showtimeCount}</span></div>
        <div class="room-mini-seats">${r.seats.slice(0,40).map(s=>`<div class="room-mini-seat${Math.random()>0.6?' occupied':''}"></div>`).join('')}</div>
        <p style="text-align:center;margin-top:0.75rem;font-size:0.8rem;color:var(--accent-light)">👆 Bấm để xem chi tiết sơ đồ ghế</p>
      </div>`;
    }).join('');
    // Click vào phòng để xem chi tiết
    grid.querySelectorAll('.room-card').forEach(card => {
      card.addEventListener('click', () => openRoomDetail(card.dataset.roomId));
    });
  }

  // Room Detail Modal
  function openRoomDetail(roomId) {
    const room = mgr.findRoom(roomId);
    if (!room) return;
    document.getElementById('room-detail-title').textContent = '🏛️ ' + room.name;
    document.getElementById('room-detail-info').innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
        <div style="text-align:center;padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm)">
          <div style="font-size:1.5rem;font-weight:800;font-family:Outfit">${room.totalSeats}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">Tổng ghế</div>
        </div>
        <div style="text-align:center;padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm)">
          <div style="font-size:1.5rem;font-weight:800;font-family:Outfit;color:var(--warning)">${room.seats.filter(s=>s.type==='vip').length}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">Ghế VIP</div>
        </div>
        <div style="text-align:center;padding:0.75rem;background:var(--bg-secondary);border-radius:var(--radius-sm)">
          <div style="font-size:1.5rem;font-weight:800;font-family:Outfit;color:#ec4899">${room.seats.filter(s=>s.type==='couple').length}</div>
          <div style="font-size:0.75rem;color:var(--text-secondary)">Ghế Couple</div>
        </div>
      </div>`;
    // Render seat map
    const seatMap = document.getElementById('room-detail-seats');
    const rows = {};
    room.seats.forEach(s => { if(!rows[s.row]) rows[s.row]=[]; rows[s.row].push(s); });
    seatMap.innerHTML = '';
    Object.keys(rows).sort().forEach(rowLabel => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'seat-row';
      rowDiv.innerHTML = `<span class="seat-row-label">${rowLabel}</span>`;
      rows[rowLabel].sort((a,b) => a.number - b.number).forEach(seat => {
        const btn = document.createElement('div');
        btn.className = `seat ${seat.type}`;
        btn.textContent = seat.number;
        btn.style.cursor = 'default';
        rowDiv.appendChild(btn);
      });
      seatMap.appendChild(rowDiv);
    });
    document.getElementById('room-detail-modal').classList.add('show');
  }
  document.getElementById('room-detail-close').addEventListener('click', () => {
    document.getElementById('room-detail-modal').classList.remove('show');
  });

  // ===== CUSTOMERS =====
  function renderCustomers() {
    const tbody = document.getElementById('customer-tbody');
    tbody.innerHTML = mgr.customers.map(c => `<tr>
      <td>${c.id.slice(0,8)}</td><td>${c.name}</td><td>${c.phone}</td><td>${c.email||'—'}</td>
      <td><span class="status-badge status-active">${c.getTypeName()}</span></td>
      <td>${fmt(mgr.getSpendingByCustomer(c.id))}</td>
      <td>${mgr.getTicketCountByCustomer(c.id)}</td>
    </tr>`).join('');
  }

  // ===== REVENUE =====
  function renderRevenue() {
    const total = mgr.getTotalRevenue();
    document.getElementById('rev-today').textContent = fmt(total);
    document.getElementById('rev-week').textContent = fmt(total);
    document.getElementById('rev-month').textContent = fmt(total);
    // Chart
    const chart = document.getElementById('revenue-chart');
    const data = mgr.movies.map(m => ({title:m.title, rev:mgr.getRevenueByMovie(m.id)})).filter(d=>d.rev>0);
    const maxRev = Math.max(...data.map(d=>d.rev), 1);
    chart.innerHTML = data.length ? data.map(d => {
      const h = Math.max(20, (d.rev/maxRev)*180);
      return `<div class="chart-bar" style="height:${h}px"><span class="chart-bar-value">${fmt(d.rev)}</span><span class="chart-bar-label">${d.title.length>12?d.title.slice(0,12)+'…':d.title}</span></div>`;
    }).join('') : '<p style="color:var(--text-muted);margin:auto">Chưa có dữ liệu doanh thu</p>';
    // Transactions
    const tbody = document.getElementById('transaction-tbody');
    tbody.innerHTML = mgr.tickets.slice(-10).reverse().map(t => {
      const st = mgr.findShowtime(t.showtimeId);
      const mv = st ? mgr.findMovie(st.movieId) : null;
      const cust = mgr.findCustomer(t.customerId);
      return `<tr><td>${t.id.slice(0,8)}</td><td>${mv?mv.title:'N/A'}</td><td>${cust?cust.name:'N/A'}</td><td>${t.seatLabels.join(', ')}</td><td>${new Date(t.createdAt).toLocaleString('vi-VN')}</td><td style="color:var(--success);font-weight:700">${fmt(t.totalPrice)}</td></tr>`;
    }).join('');
  }

  // ===== NOTIFICATION SYSTEM =====
  let notifications = JSON.parse(localStorage.getItem('cinemax_notifications') || '[]');
  function addNotification(icon, message) {
    notifications.unshift({ icon, message, time: new Date().toLocaleString('vi-VN') });
    if (notifications.length > 20) notifications = notifications.slice(0, 20);
    localStorage.setItem('cinemax_notifications', JSON.stringify(notifications));
    updateNotificationUI();
  }
  function updateNotificationUI() {
    const badge = document.getElementById('notification-badge');
    badge.textContent = notifications.length;
    badge.classList.toggle('hidden', notifications.length === 0);
    const list = document.getElementById('notif-list');
    if (notifications.length === 0) {
      list.innerHTML = '<p class="notif-empty">Không có thông báo mới</p>';
    } else {
      list.innerHTML = notifications.map(n =>
        `<div class="notif-item"><span class="notif-icon">${n.icon}</span><div class="notif-content"><p>${n.message}</p><small>${n.time}</small></div></div>`
      ).join('');
    }
  }
  document.getElementById('notification-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('notification-dropdown').classList.toggle('show');
  });
  document.getElementById('notif-clear').addEventListener('click', () => {
    notifications = [];
    localStorage.setItem('cinemax_notifications', '[]');
    updateNotificationUI();
    showToast('Đã xóa tất cả thông báo', 'info');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('.notification-wrapper')) {
      document.getElementById('notification-dropdown').classList.remove('show');
    }
  });

  // Seed initial notifications if empty
  if (notifications.length === 0) {
    addNotification('🎬', 'Hệ thống CineMax đã khởi động thành công');
    addNotification('📊', `Hiện có ${mgr.movies.length} phim và ${mgr.showtimes.length} lịch chiếu`);
    addNotification('🎫', 'Sẵn sàng đặt vé cho khách hàng');
  }
  updateNotificationUI();

  // ===== UPDATE SIDEBAR USER INFO =====
  function updateSidebarUser() {
    const user = auth.currentUser;
    if (!user) return;
    document.getElementById('sidebar-avatar').textContent = user.avatar;
    document.getElementById('sidebar-username').textContent = user.name;
    document.getElementById('sidebar-role').textContent = user.getRoleName();
  }
  updateSidebarUser();

  // ===== LOGOUT =====
  document.getElementById('btn-logout').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đăng xuất?')) {
      auth.logout();
      document.getElementById('app-wrapper').style.display = 'none';
      document.getElementById('login-screen').classList.remove('hidden');
      document.getElementById('login-screen').style.animation = 'fadeIn 0.4s ease';
      document.getElementById('login-form').reset();
      document.getElementById('login-error').classList.remove('show');
      showToast('Đã đăng xuất thành công!', 'info');
    }
  });

  // ===== ACCOUNTS SECTION =====
  function renderAccounts() {
    const user = auth.currentUser;
    if (!user) return;
    // Profile card
    document.getElementById('profile-avatar').textContent = user.avatar;
    document.getElementById('profile-name').textContent = user.name;
    document.getElementById('profile-role').textContent = user.getRoleName();
    document.getElementById('profile-email').textContent = '📧 ' + (user.email || 'Chưa cập nhật');
    document.getElementById('profile-last-login').textContent = user.lastLogin ? '🕐 Đăng nhập lần cuối: ' + new Date(user.lastLogin).toLocaleString('vi-VN') : '';
    // Account list (admin only)
    const listCard = document.getElementById('accounts-list-card');
    if (user.role === 'admin') {
      listCard.style.display = 'block';
      const tbody = document.getElementById('accounts-tbody');
      const roleColors = {admin:'var(--accent)',staff:'var(--success)',manager:'var(--warning)'};
      const roleGradients = {admin:'var(--gradient-1)',staff:'var(--gradient-3)',manager:'var(--gradient-4)'};
      tbody.innerHTML = auth.users.map(u => `<tr>
        <td><div style="width:36px;height:36px;border-radius:10px;background:${roleGradients[u.role]||'var(--gradient-1)'};display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:800;color:#fff">${u.avatar}</div></td>
        <td><code style="background:var(--bg-secondary);padding:0.2rem 0.5rem;border-radius:4px;font-size:0.8rem">${u.username}</code></td>
        <td>${u.name}</td>
        <td><span class="status-badge" style="background:rgba(99,102,241,0.2);color:${roleColors[u.role]||'var(--accent-light)'}">${u.getRoleName()}</span></td>
        <td>${u.email || '—'}</td>
        <td style="font-size:0.8rem;color:var(--text-muted)">${u.lastLogin ? new Date(u.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</td>
      </tr>`).join('');
    } else {
      listCard.style.display = 'none';
    }
  }

  // Change password form
  document.getElementById('change-password-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const currentPwd = document.getElementById('current-password').value;
    const newPwd = document.getElementById('new-password').value;
    const confirmPwd = document.getElementById('confirm-password').value;
    if (newPwd !== confirmPwd) {
      showToast('Mật khẩu mới không khớp!', 'error');
      return;
    }
    if (newPwd.length < 4) {
      showToast('Mật khẩu mới phải ít nhất 4 ký tự!', 'error');
      return;
    }
    try {
      auth.changePassword(auth.currentUser.id, currentPwd, newPwd);
      showToast('Đổi mật khẩu thành công!', 'success');
      document.getElementById('change-password-form').reset();
      addNotification('🔑', `Tài khoản "${auth.currentUser.username}" đã đổi mật khẩu`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  });

  // Add login notification
  addNotification('🔐', `${currentUser.name} (${currentUser.getRoleName()}) đã đăng nhập`);

  // ===== INIT =====
  renderDashboard();
  renderMovies();
  renderShowtimes();
  renderRooms();
  renderCustomers();

  } // end initApp
});
