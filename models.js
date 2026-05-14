// ============================================================
// models.js - Tầng Model (OOP): Encapsulation, Inheritance,
// Polymorphism, Abstraction, Design Patterns
// ============================================================

// ===== 1. ENCAPSULATION: Lớp trừu tượng cơ sở =====
class Entity {
  #id;
  constructor(id) { this.#id = id || Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  get id() { return this.#id; }
  toJSON() { throw new Error("Lớp con phải override toJSON()"); }
}

// ===== 2. INHERITANCE + ENCAPSULATION: Movie =====
class Movie extends Entity {
  #title; #genre; #duration; #director; #rating; #description; #poster;
  constructor({id,title,genre,duration,director="",rating=0,description="",poster=""}={}) {
    super(id); this.#title=title; this.#genre=genre; this.#duration=duration;
    this.#director=director; this.#rating=rating; this.#description=description; this.#poster=poster;
  }
  get title(){return this.#title} set title(v){if(!v)throw new Error("Tên phim không được rỗng");this.#title=v}
  get genre(){return this.#genre} set genre(v){this.#genre=v}
  get duration(){return this.#duration} set duration(v){if(v<1)throw new Error("Thời lượng phải > 0");this.#duration=v}
  get director(){return this.#director} set director(v){this.#director=v}
  get rating(){return this.#rating} set rating(v){this.#rating=Math.min(10,Math.max(0,v))}
  get description(){return this.#description} set description(v){this.#description=v}
  get poster(){return this.#poster} set poster(v){this.#poster=v}
  getInfo(){return `${this.#title} (${this.#genre}) - ${this.#duration} phút`}
  toJSON(){return{id:this.id,title:this.#title,genre:this.#genre,duration:this.#duration,director:this.#director,rating:this.#rating,description:this.#description,poster:this.#poster}}
}

// ===== 3. INHERITANCE + POLYMORPHISM: Seat hierarchy =====
class Seat extends Entity {
  #row; #number; #isOccupied;
  constructor({id,row,number,isOccupied=false}={}) { super(id); this.#row=row; this.#number=number; this.#isOccupied=isOccupied; }
  get row(){return this.#row} get number(){return this.#number}
  get isOccupied(){return this.#isOccupied} set isOccupied(v){this.#isOccupied=v}
  get label(){return `${this.#row}${this.#number}`}
  get type(){return "normal"}
  // POLYMORPHISM: phương thức tính giá được override ở lớp con
  calculatePrice(basePrice){return basePrice}
  toJSON(){return{id:this.id,row:this.#row,number:this.#number,type:this.type,isOccupied:this.#isOccupied}}
}

class VIPSeat extends Seat {
  get type(){return "vip"}
  // Override: ghế VIP giá x1.5
  calculatePrice(basePrice){return Math.round(basePrice*1.5)}
}

class CoupleSeat extends Seat {
  get type(){return "couple"}
  // Override: ghế đôi giá x2
  calculatePrice(basePrice){return Math.round(basePrice*2)}
}

// ===== FACTORY PATTERN: Tạo ghế theo loại =====
class SeatFactory {
  static create(type, data) {
    switch(type) {
      case "vip": return new VIPSeat(data);
      case "couple": return new CoupleSeat(data);
      default: return new Seat(data);
    }
  }
}

// ===== 4. Room =====
class Room extends Entity {
  #name; #seats;
  constructor({id,name,rows=8,seatsPerRow=10}={}) {
    super(id); this.#name=name; this.#seats=[];
    const rowLabels="ABCDEFGHIJKLMN";
    for(let r=0;r<rows;r++){
      for(let s=1;s<=seatsPerRow;s++){
        let type="normal";
        if(r>=rows-2) type="couple"; // 2 hàng cuối: couple
        else if(r>=rows-4) type="vip"; // 2 hàng tiếp: VIP
        if(type==="couple"&&s%2===0) continue; // couple seat chiếm 2 chỗ
        this.#seats.push(SeatFactory.create(type,{row:rowLabels[r],number:s}));
      }
    }
  }
  get name(){return this.#name}
  get seats(){return[...this.#seats]}
  get totalSeats(){return this.#seats.length}
  get availableSeats(){return this.#seats.filter(s=>!s.isOccupied).length}
  getSeat(row,number){return this.#seats.find(s=>s.row===row&&s.number===number)}
  resetSeats(){this.#seats.forEach(s=>s.isOccupied=false)}
  toJSON(){return{id:this.id,name:this.#name,seats:this.#seats.map(s=>s.toJSON())}}
}

// ===== 5. Showtime =====
class Showtime extends Entity {
  #movieId; #roomId; #date; #time; #basePrice; #bookedSeats;
  constructor({id,movieId,roomId,date,time,basePrice=75000}={}) {
    super(id); this.#movieId=movieId; this.#roomId=roomId;
    this.#date=date; this.#time=time; this.#basePrice=basePrice; this.#bookedSeats=new Set();
  }
  get movieId(){return this.#movieId} get roomId(){return this.#roomId}
  get date(){return this.#date} get time(){return this.#time}
  get basePrice(){return this.#basePrice}
  get bookedSeats(){return[...this.#bookedSeats]}
  get status(){return this.#bookedSeats.size>50?"Gần đầy":"Còn chỗ"}
  bookSeat(label){this.#bookedSeats.add(label)}
  isSeatBooked(label){return this.#bookedSeats.has(label)}
  toJSON(){return{id:this.id,movieId:this.#movieId,roomId:this.#roomId,date:this.#date,time:this.#time,basePrice:this.#basePrice,bookedSeats:[...this.#bookedSeats]}}
}

// ===== 6. INHERITANCE + POLYMORPHISM: Person hierarchy =====
class Person extends Entity {
  #name; #phone; #email;
  constructor({id,name,phone,email=""}={}) { super(id); this.#name=name; this.#phone=phone; this.#email=email; }
  get name(){return this.#name} set name(v){this.#name=v}
  get phone(){return this.#phone} get email(){return this.#email}
  // POLYMORPHISM: tính giảm giá
  getDiscount(){return 0}
  getTypeName(){return "Người dùng"}
  toJSON(){return{id:this.id,name:this.#name,phone:this.#phone,email:this.#email,type:"regular"}}
}

class RegularCustomer extends Person {
  getDiscount(){return 0}
  getTypeName(){return "Khách thường"}
  toJSON(){return{...super.toJSON(),type:"regular"}}
}

class MemberCustomer extends Person {
  getDiscount(){return 0.1} // Giảm 10%
  getTypeName(){return "Thành viên"}
  toJSON(){return{...super.toJSON(),type:"member"}}
}

class VIPCustomer extends Person {
  getDiscount(){return 0.2} // Giảm 20%
  getTypeName(){return "VIP"}
  toJSON(){return{...super.toJSON(),type:"vip"}}
}

// ===== FACTORY PATTERN: Tạo khách hàng theo loại =====
class CustomerFactory {
  static create(type, data) {
    switch(type) {
      case "member": return new MemberCustomer(data);
      case "vip": return new VIPCustomer(data);
      default: return new RegularCustomer(data);
    }
  }
}

// ===== 7. Ticket =====
class Ticket extends Entity {
  #showtimeId; #customerId; #seatLabels; #totalPrice; #createdAt;
  constructor({id,showtimeId,customerId,seatLabels=[],totalPrice=0}={}) {
    super(id); this.#showtimeId=showtimeId; this.#customerId=customerId;
    this.#seatLabels=seatLabels; this.#totalPrice=totalPrice; this.#createdAt=new Date().toISOString();
  }
  get showtimeId(){return this.#showtimeId} get customerId(){return this.#customerId}
  get seatLabels(){return[...this.#seatLabels]} get totalPrice(){return this.#totalPrice}
  get createdAt(){return this.#createdAt}
  toJSON(){return{id:this.id,showtimeId:this.#showtimeId,customerId:this.#customerId,seatLabels:this.#seatLabels,totalPrice:this.#totalPrice,createdAt:this.#createdAt}}
}

// ===== 8. SINGLETON PATTERN: CinemaManager =====
class CinemaManager {
  static #instance = null;
  #movies=[]; #rooms=[]; #showtimes=[]; #customers=[]; #tickets=[];

  constructor() {
    if(CinemaManager.#instance) return CinemaManager.#instance;
    CinemaManager.#instance=this;
    this.#loadData();
  }
  static getInstance(){if(!CinemaManager.#instance)new CinemaManager();return CinemaManager.#instance;}

  // --- Movies CRUD ---
  get movies(){return[...this.#movies]}
  addMovie(data){const m=new Movie(data);this.#movies.push(m);this.#saveData();return m}
  updateMovie(id,data){const m=this.#movies.find(x=>x.id===id);if(!m)throw new Error("Không tìm thấy phim");Object.keys(data).forEach(k=>{if(k!=='id')m[k]=data[k]});this.#saveData();return m}
  deleteMovie(id){this.#movies=this.#movies.filter(x=>x.id!==id);this.#saveData()}
  findMovie(id){return this.#movies.find(x=>x.id===id)}

  // --- Rooms ---
  get rooms(){return[...this.#rooms]}
  findRoom(id){return this.#rooms.find(x=>x.id===id)}

  // --- Showtimes CRUD ---
  get showtimes(){return[...this.#showtimes]}
  addShowtime(data){const s=new Showtime(data);this.#showtimes.push(s);this.#saveData();return s}
  deleteShowtime(id){this.#showtimes=this.#showtimes.filter(x=>x.id!==id);this.#saveData()}
  findShowtime(id){return this.#showtimes.find(x=>x.id===id)}

  // --- Customers ---
  get customers(){return[...this.#customers]}
  addCustomer(type,data){const c=CustomerFactory.create(type,data);this.#customers.push(c);this.#saveData();return c}
  findCustomer(id){return this.#customers.find(x=>x.id===id)}
  findCustomerByPhone(phone){return this.#customers.find(x=>x.phone===phone)}

  // --- Tickets / Booking ---
  get tickets(){return[...this.#tickets]}
  bookTicket({showtimeId,customerType,customerData,seatLabels,room}){
    try {
      const showtime=this.findShowtime(showtimeId);
      if(!showtime)throw new Error("Lịch chiếu không tồn tại");
      // Kiểm tra ghế đã đặt chưa
      for(const label of seatLabels){if(showtime.isSeatBooked(label))throw new Error(`Ghế ${label} đã được đặt`)}
      // Tìm hoặc tạo khách hàng
      let customer=this.findCustomerByPhone(customerData.phone);
      if(!customer) customer=this.addCustomer(customerType,customerData);
      // Tính giá: POLYMORPHISM ở cả Seat và Customer
      let total=0;
      for(const label of seatLabels){
        const row=label[0], num=parseInt(label.slice(1));
        const seat=room.getSeat(row,num);
        if(seat) total+=seat.calculatePrice(showtime.basePrice);
        else total+=showtime.basePrice;
      }
      total=Math.round(total*(1-customer.getDiscount()));
      // Tạo vé và đánh dấu ghế
      const ticket=new Ticket({showtimeId,customerId:customer.id,seatLabels,totalPrice:total});
      seatLabels.forEach(l=>showtime.bookSeat(l));
      this.#tickets.push(ticket);
      this.#saveData();
      return{ticket,customer,showtime};
    } catch(e) { throw e; } // Exception handling
  }

  // --- Thống kê ---
  getTotalRevenue(){return this.#tickets.reduce((s,t)=>s+t.totalPrice,0)}
  // Đếm tổng số vé (theo từng ghế, không phải lượt đặt)
  getTotalSeatsSold(){return this.#tickets.reduce((s,t)=>s+t.seatLabels.length,0)}
  getRevenueByMovie(movieId){
    const stIds=new Set(this.#showtimes.filter(s=>s.movieId===movieId).map(s=>s.id));
    return this.#tickets.filter(t=>stIds.has(t.showtimeId)).reduce((s,t)=>s+t.totalPrice,0);
  }
  getTicketCountByCustomer(custId){return this.#tickets.filter(t=>t.customerId===custId).reduce((s,t)=>s+t.seatLabels.length,0)}
  getSpendingByCustomer(custId){return this.#tickets.filter(t=>t.customerId===custId).reduce((s,t)=>s+t.totalPrice,0)}

  // --- PERSISTENCE: Lưu/Đọc localStorage ---
  #saveData(){
    try{
      localStorage.setItem('cinemax_movies',JSON.stringify(this.#movies.map(m=>m.toJSON())));
      localStorage.setItem('cinemax_showtimes',JSON.stringify(this.#showtimes.map(s=>s.toJSON())));
      localStorage.setItem('cinemax_customers',JSON.stringify(this.#customers.map(c=>c.toJSON())));
      localStorage.setItem('cinemax_tickets',JSON.stringify(this.#tickets.map(t=>t.toJSON())));
    }catch(e){console.error("Lỗi lưu dữ liệu:",e)}
  }
  #loadData(){
    try{
      // Load movies
      const mv=JSON.parse(localStorage.getItem('cinemax_movies')||'[]');
      this.#movies=mv.map(d=>new Movie(d));
      // Init rooms
      this.#rooms=[
        new Room({id:'room1',name:'Phòng 1 - Standard',rows:8,seatsPerRow:10}),
        new Room({id:'room2',name:'Phòng 2 - Premium',rows:6,seatsPerRow:8}),
        new Room({id:'room3',name:'Phòng 3 - IMAX',rows:10,seatsPerRow:12})
      ];
      // Load showtimes
      const st=JSON.parse(localStorage.getItem('cinemax_showtimes')||'[]');
      this.#showtimes=st.map(d=>{const s=new Showtime(d);(d.bookedSeats||[]).forEach(l=>s.bookSeat(l));return s});
      // Load customers
      const cs=JSON.parse(localStorage.getItem('cinemax_customers')||'[]');
      this.#customers=cs.map(d=>CustomerFactory.create(d.type,d));
      // Load tickets
      const tk=JSON.parse(localStorage.getItem('cinemax_tickets')||'[]');
      this.#tickets=tk.map(d=>new Ticket(d));
      // Seed sample data if empty
      if(this.#movies.length===0) this.#seedData();
    }catch(e){console.error("Lỗi đọc dữ liệu:",e);this.#seedData()}
  }
  #seedData(){
    const sampleMovies=[
      {title:"Avengers: Endgame",genre:"Hành động",duration:181,director:"Russo Brothers",rating:8.4,description:"Trận chiến cuối cùng của biệt đội siêu anh hùng"},
      {title:"Spirited Away",genre:"Hoạt hình",duration:125,director:"Hayao Miyazaki",rating:8.6,description:"Cuộc phiêu lưu kỳ diệu của cô bé Chihiro"},
      {title:"Parasite",genre:"Tình cảm",duration:132,director:"Bong Joon-ho",rating:8.5,description:"Câu chuyện về hai gia đình ở hai tầng lớp xã hội"},
      {title:"The Conjuring",genre:"Kinh dị",duration:112,director:"James Wan",rating:7.5,description:"Vụ án siêu nhiên kinh hoàng"},
      {title:"Interstellar",genre:"Viễn tưởng",duration:169,director:"Christopher Nolan",rating:8.7,description:"Hành trình xuyên không gian để cứu nhân loại"}
    ];
    sampleMovies.forEach(d=>this.addMovie(d));
    const today=new Date().toISOString().split('T')[0];
    this.#movies.forEach((m,i)=>{
      this.addShowtime({movieId:m.id,roomId:this.#rooms[i%3].id,date:today,time:`${14+i*2}:00`,basePrice:75000+i*10000});
    });
  }
}

// ===== 9. INHERITANCE: User Account =====
class User extends Person {
  #username; #passwordHash; #role; #avatar; #lastLogin;
  constructor({id,name,phone,email,username,password,passwordHash,role='staff',avatar='',lastLogin=''}={}) {
    super({id,name,phone,email});
    this.#username = username;
    // Simple hash simulation for demo (in production, use bcrypt etc.)
    this.#passwordHash = passwordHash || User.hashPassword(password || '');
    this.#role = role;
    this.#avatar = avatar || name ? name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() : 'U';
    this.#lastLogin = lastLogin;
  }
  get username(){return this.#username}
  get role(){return this.#role}
  get avatar(){return this.#avatar}
  get lastLogin(){return this.#lastLogin}
  set lastLogin(v){this.#lastLogin=v}
  getRoleName(){
    const roles = {admin:'Quản trị viên',staff:'Nhân viên',manager:'Quản lý'};
    return roles[this.#role]||'Nhân viên';
  }
  getTypeName(){return this.getRoleName()}
  verifyPassword(password){return this.#passwordHash===User.hashPassword(password)}
  static hashPassword(pwd){
    // Simple hash for demo purposes
    let hash=0;
    for(let i=0;i<pwd.length;i++){hash=((hash<<5)-hash)+pwd.charCodeAt(i);hash|=0;}
    return 'hash_'+Math.abs(hash).toString(36);
  }
  toJSON(){return{...super.toJSON(),username:this.#username,passwordHash:this.#passwordHash,role:this.#role,avatar:this.#avatar,lastLogin:this.#lastLogin,type:'user'}}
}

// ===== SINGLETON: AccountManager =====
class AccountManager {
  static #instance = null;
  #users = [];
  #currentUser = null;

  constructor() {
    if(AccountManager.#instance) return AccountManager.#instance;
    AccountManager.#instance = this;
    this.#loadUsers();
  }
  static getInstance(){if(!AccountManager.#instance)new AccountManager();return AccountManager.#instance;}

  get users(){return[...this.#users]}
  get currentUser(){return this.#currentUser}

  login(username, password){
    const user = this.#users.find(u=>u.username===username);
    if(!user) throw new Error('Tên đăng nhập không tồn tại');
    if(!user.verifyPassword(password)) throw new Error('Mật khẩu không chính xác');
    user.lastLogin = new Date().toISOString();
    this.#currentUser = user;
    this.#saveUsers();
    localStorage.setItem('cinemax_session', JSON.stringify({userId:user.id,username:user.username,loginTime:new Date().toISOString()}));
    return user;
  }

  logout(){
    this.#currentUser = null;
    localStorage.removeItem('cinemax_session');
  }

  restoreSession(){
    try{
      const session = JSON.parse(localStorage.getItem('cinemax_session')||'null');
      if(!session) return null;
      const user = this.#users.find(u=>u.id===session.userId);
      if(user){this.#currentUser=user;return user;}
      return null;
    }catch(e){return null;}
  }

  isLoggedIn(){return this.#currentUser!==null}

  addUser(data){
    if(this.#users.find(u=>u.username===data.username)) throw new Error('Tên đăng nhập đã tồn tại');
    const user = new User(data);
    this.#users.push(user);
    this.#saveUsers();
    return user;
  }

  changePassword(userId, oldPwd, newPwd){
    const user = this.#users.find(u=>u.id===userId);
    if(!user) throw new Error('Không tìm thấy tài khoản');
    if(!user.verifyPassword(oldPwd)) throw new Error('Mật khẩu cũ không đúng');
    // Re-create user with new password
    const json = user.toJSON();
    json.passwordHash = User.hashPassword(newPwd);
    const idx = this.#users.indexOf(user);
    this.#users[idx] = new User(json);
    this.#saveUsers();
  }

  #saveUsers(){
    try{
      localStorage.setItem('cinemax_users', JSON.stringify(this.#users.map(u=>u.toJSON())));
    }catch(e){console.error('Lỗi lưu tài khoản:',e)}
  }

  #loadUsers(){
    try{
      const data = JSON.parse(localStorage.getItem('cinemax_users')||'[]');
      this.#users = data.map(d=>new User(d));
      if(this.#users.length===0) this.#seedDefaultUsers();
    }catch(e){console.error('Lỗi đọc tài khoản:',e);this.#seedDefaultUsers();}
  }

  #seedDefaultUsers(){
    this.addUser({name:'Nguyễn Admin',phone:'0901000001',email:'admin@cinemax.vn',username:'admin',password:'admin123',role:'admin'});
    this.addUser({name:'Trần Nhân Viên',phone:'0901000002',email:'staff@cinemax.vn',username:'staff',password:'staff123',role:'staff'});
    this.addUser({name:'Lê Quản Lý',phone:'0901000003',email:'manager@cinemax.vn',username:'manager',password:'manager123',role:'manager'});
  }
}

// Export cho app.js sử dụng
window.CinemaManager = CinemaManager;
window.SeatFactory = SeatFactory;
window.User = User;
window.AccountManager = AccountManager;
