# Power Up! Personal Learning Portfolio (Group 13)

เว็บแอปพลิเคชันสำหรับบันทึกและแสดงผล Personal Learning Portfolio รองรับการเพิ่มรายการผลงาน (Portfolio Items), การตรวจเช็กความถูกต้องของข้อมูล (Form Validation) และการบันทึกข้อมูลไว้ใน Browser ด้วย localStorage

## คุณสมบัติการทำงาน
- **Multiple Portfolios:** สร้างและสลับดู Portfolio ได้มากกว่า 2 รายการ ข้อมูลแยกกันชัดเจนไม่ปะปนกัน
- **Portfolio Items:** เพิ่มผลงานหรือกิจกรรมย่อยได้หลายรายการต่อ 1 Portfolio
- **Data Validation:** มีระบบตรวจเช็กการกรอกข้อมูล เช่น ลิงก์ URL และวันที่ ให้ถูกต้องก่อนบันทึก
- **localStorage:** บันทึกข้อมูลไว้ใน Browser เปิดกลับมาหรือ Refresh หน้าจอ ข้อมูลก็ยังอยู่ครบ

## ตัวอย่างไฟล์ข้อมูล JSON
โปรเจกต์นี้มีไฟล์ข้อมูลตัวอย่าง 2 ไฟล์ตามโครงสร้าง Data Contract ของรายวิชา:
- `sample-portfolio-1.json` - ข้อมูล Portfolio ตัวอย่างชุดที่ 1
- `sample-portfolio-2.json` - ข้อมูล Portfolio ตัวอย่างชุดที่ 2

## วิธีเปิดใช้งาน
1. Clone Repository นี้ลงเครื่อง:
  ```git clone https://github.com/Ledomnat/CS100G13Project.git```

2. เปิดไฟล์ index.html ด้วย Web Browser (เช่น Chrome, Edge, Safari) หรือเปิดผ่าน Live Server บน VS Code
   
4. ทดลองเพิ่ม Portfolio, เพิ่ม Item ผลงาน และลอง Refresh หน้าจอเพื่อดูการบันทึกข้อมูล
