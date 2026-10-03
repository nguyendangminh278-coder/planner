export const demoUser = {
  uid: 'demo-user',
  displayName: 'Nguyễn Minh',
  email: 'minh@example.com',
  photoURL: ''
};

export const demoEvents = [
  { id:'e1', title:'Daily team', start:'2026-10-05T09:00:00+07:00', end:'2026-10-05T09:45:00+07:00', color:'#d8ecff', owner:'Bạn' },
  { id:'e2', title:'Review tài liệu', start:'2026-10-06T14:00:00+07:00', end:'2026-10-06T15:30:00+07:00', color:'#f7d8e6', owner:'Bạn' },
  { id:'e3', title:'Workshop vận hành', start:'2026-10-08T10:30:00+07:00', end:'2026-10-08T12:00:00+07:00', color:'#ddf0dd', owner:'Bạn' },
  { id:'e4', title:'Chốt checklist', start:'2026-10-10T09:30:00+07:00', end:'2026-10-10T10:30:00+07:00', color:'#f7e7c3', owner:'Bạn' },
];

export const demoSharedEvents = [
  { id:'s1', title:'Họp với Tiến', start:'2026-10-05T15:00:00+07:00', end:'2026-10-05T16:00:00+07:00', color:'#e5ddf8', owner:'Bùi Duy Tiến' },
  { id:'s2', title:'Check tiến độ', start:'2026-10-09T13:30:00+07:00', end:'2026-10-09T14:30:00+07:00', color:'#e5ddf8', owner:'Bùi Duy Tiến' },
];

export const demoTasks = [
  {
    id:'t1',
    title:'Hoàn thành quy trình thẻ',
    start:'2026-10-01', end:'2026-10-10', progress:62,
    color:'#f3cfd8',
    details:'Hoàn thiện toàn bộ quy trình từ mở thẻ, vận hành thử đến viết tài liệu bàn giao.',
    steps:[
      {id:'t1-s1', title:'Mở thẻ', start:'2026-10-01', end:'2026-10-03', progress:100, color:'#f7dfbd', details:'Tạo thẻ, rà soát quyền, cập nhật checklist mở thẻ.'},
      {id:'t1-s2', title:'Vận hành', start:'2026-10-03', end:'2026-10-07', progress:70, color:'#cfe9de', details:'Vận hành thử, log lỗi, chốt luồng xử lý và người phụ trách.'},
      {id:'t1-s3', title:'Viết tài liệu', start:'2026-10-07', end:'2026-10-10', progress:35, color:'#d8e4fa', details:'Viết SOP, ảnh minh hoạ, checklist bàn giao và version cuối.'},
    ]
  },
  {
    id:'t2', title:'Chuẩn bị demo dashboard', start:'2026-10-06', end:'2026-10-09', progress:45, color:'#e8d8f4',
    details:'Chuẩn bị dữ liệu demo và kịch bản trình bày.',
    steps:[
      {id:'t2-s1', title:'Chốt dữ liệu', start:'2026-10-06', end:'2026-10-07', progress:80, color:'#d8ecff', details:'Kiểm tra dataset và các KPI chính.'},
      {id:'t2-s2', title:'Dựng demo', start:'2026-10-08', end:'2026-10-09', progress:20, color:'#ffe0d3', details:'Dựng các màn chính và test flow.'},
    ]
  }
];
