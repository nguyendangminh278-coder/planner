export const demoUser = {
  uid: 'demo-user',
  displayName: 'Nguyễn Minh',
  email: 'minh@example.com',
  photoURL: ''
};

export const demoEvents = [
  { id:'e1', title:'Daily team', start:'2026-10-05T09:00:00+07:00', end:'2026-10-05T09:45:00+07:00', color:'#cffafe', owner:'Bạn' },
  { id:'e2', title:'Review tài liệu', start:'2026-10-06T14:00:00+07:00', end:'2026-10-06T15:30:00+07:00', color:'#ffe4e6', owner:'Bạn' },
  { id:'e3', title:'Workshop vận hành', start:'2026-10-08T10:30:00+07:00', end:'2026-10-08T12:00:00+07:00', color:'#d1fae5', owner:'Bạn' },
  { id:'e4', title:'Chốt checklist', start:'2026-10-10T09:30:00+07:00', end:'2026-10-10T10:30:00+07:00', color:'#fef3c7', owner:'Bạn' },
];

export const demoSharedEvents = [
  { id:'s1', title:'Họp với Tiến', start:'2026-10-05T15:00:00+07:00', end:'2026-10-05T16:00:00+07:00', color:'#f3e8ff', owner:'Bùi Duy Tiến' },
  { id:'s2', title:'Check tiến độ', start:'2026-10-09T13:30:00+07:00', end:'2026-10-09T14:30:00+07:00', color:'#f3e8ff', owner:'Bùi Duy Tiến' },
];

export const demoSharedTasks = [{
  id: 'peer-task', title: 'Chuẩn bị kế hoạch lớp', start: '2026-10-05', end: '2026-10-10', progress: 40, color: '#e0e7ff',
  details: 'Tổng hợp kế hoạch học tập và phân công công việc cho nhóm.',
  steps: [
    { id: 'peer-step-1', title: 'Chốt nội dung', start: '2026-10-05', end: '2026-10-07', progress: 80, color: '#cffafe', details: 'Rà soát các mốc nộp bài và tài liệu cần chuẩn bị.' },
    { id: 'peer-step-2', title: 'Phân công nhóm', start: '2026-10-08', end: '2026-10-10', progress: 10, color: '#d1fae5', details: 'Chia đầu việc, ghi chú từng bước và thống nhất người phụ trách.' },
  ],
}];

export const demoTasks = [
  {
    id:'t1',
    title:'Hoàn thành quy trình thẻ',
    start:'2026-10-01', end:'2026-10-10', progress:62,
    color:'#ffe4e6',
    details:'Hoàn thiện toàn bộ quy trình từ mở thẻ, vận hành thử đến viết tài liệu bàn giao.',
    steps:[
      {id:'t1-s1', title:'Mở thẻ', start:'2026-10-01', end:'2026-10-03', progress:100, color:'#ffedd5', details:'Tạo thẻ, rà soát quyền, cập nhật checklist mở thẻ.'},
      {id:'t1-s2', title:'Vận hành', start:'2026-10-03', end:'2026-10-07', progress:70, color:'#d1fae5', details:'Vận hành thử, log lỗi, chốt luồng xử lý và người phụ trách.'},
      {id:'t1-s3', title:'Viết tài liệu', start:'2026-10-07', end:'2026-10-10', progress:35, color:'#e0e7ff', details:'Viết SOP, ảnh minh hoạ, checklist bàn giao và version cuối.'},
    ]
  },
  {
    id:'t2', title:'Chuẩn bị demo dashboard', start:'2026-10-06', end:'2026-10-09', progress:45, color:'#f3e8ff',
    details:'Chuẩn bị dữ liệu demo và kịch bản trình bày.',
    steps:[
      {id:'t2-s1', title:'Chốt dữ liệu', start:'2026-10-06', end:'2026-10-07', progress:80, color:'#cffafe', details:'Kiểm tra dataset và các KPI chính.'},
      {id:'t2-s2', title:'Dựng demo', start:'2026-10-08', end:'2026-10-09', progress:20, color:'#fef3c7', details:'Dựng các màn chính và test flow.'},
    ]
  }
];
