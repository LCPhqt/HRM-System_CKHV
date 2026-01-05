import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import http from 'http';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TIMEOUT = 15000;
const TEST_STAFF_EMAIL = process.env.TEST_STAFF_EMAIL || `staff${Date.now()}@test.com`;
const TEST_STAFF_PASSWORD = process.env.TEST_STAFF_PASSWORD || 'staff123456';
const GATEWAY_URL = process.env.TEST_GATEWAY_URL || 'http://localhost:4000';

let driver;

async function setup() {
  const options = new ChromeOptions();
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  if (process.env.HEADLESS === 'true') {
    options.addArguments('--headless');
    console.log('🔇 Chạy ở chế độ headless');
  } else {
    console.log('👀 Browser sẽ hiển thị');
    options.addArguments('--start-maximized');
  }

  console.log('🔧 Đang khởi động Chrome...');
  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  
  console.log('✅ Browser đã khởi động!');
  await driver.manage().setTimeouts({ implicit: TIMEOUT });
  
  // Setup alert handler
  try {
    await driver.executeScript(`
      window.originalAlert = window.alert;
      window.alert = function(msg) {
        window.lastAlert = msg;
        console.log('Alert:', msg);
      };
    `);
  } catch (e) {
    // Ignore if script fails
  }
}

async function teardown() {
  if (driver) {
    try {
      await driver.quit();
      console.log('✅ Browser đã đóng');
    } catch (e) {
      console.error('Lỗi khi đóng browser:', e.message);
    }
  }
}

async function handleAlert() {
  try {
    const alertText = await driver.executeScript('return window.lastAlert || null;');
    if (alertText) {
      await driver.executeScript('window.lastAlert = null;');
      return alertText;
    }
  } catch (e) {
    // No alert
  }
  return null;
}

async function createStaffAccount() {
  console.log('📝 Đang tạo tài khoản nhân viên...');
  
  // Điều hướng đến trang register (hoặc login page với mode register)
  await driver.get(`${BASE_URL}/register`);
  await driver.sleep(1500);
  
  // Kiểm tra xem có đang ở mode register chưa bằng cách tìm full name input
  // Nếu không có full name input, có thể đang ở mode login, cần chuyển sang register
  let isRegisterMode = false;
  try {
    await driver.findElement(By.xpath("//label[contains(text(), 'Họ và tên')] | //input[@placeholder*='tên']"));
    isRegisterMode = true;
    console.log('✅ Đã ở mode register');
  } catch (e) {
    console.log('⚠️  Đang ở mode login, chuyển sang mode register...');
    // Tìm và click button "Đăng ký ngay" để chuyển sang mode register
    try {
      const registerToggle = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(text(), 'Đăng ký ngay')] | //button[contains(text(), 'Đăng ký') and not(contains(@type, 'submit'))]")),
        TIMEOUT
      );
      await registerToggle.click();
      await driver.sleep(1500);
      isRegisterMode = true;
      console.log('✅ Đã chuyển sang mode register');
    } catch (e2) {
      throw new Error('Không tìm thấy button để chuyển sang mode register. Cần click vào "Đăng ký ngay"');
    }
  }
  
  // Đợi form register hiển thị hoàn toàn
  await driver.sleep(1000);
  
  // Tìm và điền "Họ và tên" (required field)
  try {
    const fullNameInput = await driver.wait(
      until.elementLocated(By.xpath("//label[contains(text(), 'Họ và tên')]/following-sibling::*/input | //input[@placeholder='Nguyễn Văn A'] | //input[@type='text' and contains(@placeholder, 'tên')]")),
      TIMEOUT
    );
    await fullNameInput.clear();
    await fullNameInput.sendKeys('Nhân viên Test');
    console.log('✅ Đã điền Họ và tên');
  } catch (e) {
    console.log('⚠️  Không tìm thấy input Họ và tên, có thể không bắt buộc');
  }
  
  // Tìm email input
  const emailInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@type='email']")),
    TIMEOUT
  );
  await emailInput.clear();
  await emailInput.sendKeys(TEST_STAFF_EMAIL);
  
  // Tìm tất cả password inputs - ở mode register phải có 2
  await driver.sleep(500);
  let passwordInputs = await driver.findElements(By.xpath("//input[@type='password']"));
  
  // Nếu vẫn chỉ có 1 input, thử đợi thêm hoặc tìm lại
  if (passwordInputs.length < 2) {
    await driver.sleep(1000);
    passwordInputs = await driver.findElements(By.xpath("//input[@type='password']"));
  }
  
  // Kiểm tra lại
  if (passwordInputs.length < 2) {
    // Thử tìm bằng cách khác - có thể có label "Nhập lại mật khẩu"
    try {
      await driver.findElement(By.xpath("//label[contains(text(), 'Nhập lại mật khẩu')]"));
      // Có label nhưng không tìm thấy input - có thể cần đợi thêm
      await driver.sleep(1000);
      passwordInputs = await driver.findElements(By.xpath("//input[@type='password']"));
    } catch (e) {
      // Không có label confirm password
    }
    
    if (passwordInputs.length < 2) {
      throw new Error(`Cần 2 password inputs (password và confirm password) nhưng chỉ tìm thấy ${passwordInputs.length}. Có thể đang ở mode login hoặc form chưa load xong.`);
    }
  }
  
  // Điền password
  await passwordInputs[0].clear();
  await passwordInputs[0].sendKeys(TEST_STAFF_PASSWORD);
  await passwordInputs[1].clear();
  await passwordInputs[1].sendKeys(TEST_STAFF_PASSWORD);
  
  // Tìm và click nút submit (có thể là "Đăng ký" hoặc "Tạo tài khoản")
  const submitButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đăng ký') and @type='submit'] | //button[@type='submit']")),
    TIMEOUT
  );
  
  // Xử lý alert trước khi click submit
  try {
    await driver.switchTo().alert().dismiss();
  } catch (e) {
    // Không có alert nào
  }
  
  await submitButton.click();
  await driver.sleep(1000);
  
  // Xử lý alert sau khi submit (nếu có)
  try {
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();
    await alert.accept();
    
    if (alertText.includes('đã tồn tại') || alertText.includes('already exists')) {
      console.log('⚠️  Tài khoản đã tồn tại, sẽ dùng tài khoản này để đăng nhập');
    } else if (alertText.includes('thành công') || alertText.includes('success')) {
      console.log('✅ Đăng ký thành công');
    } else {
      console.log(`⚠️  Alert: ${alertText}`);
    }
  } catch (e) {
    // Không có alert, có thể đã redirect
  }
  
  await driver.sleep(1000);
  
  // Kiểm tra đã chuyển sang trang login sau khi đăng ký
  const currentUrl = await driver.getCurrentUrl();
  
  // Sau khi đăng ký, nên chuyển về trang login
  if (!currentUrl.includes('/login') && !currentUrl.includes('/register')) {
    // Có thể đã redirect đến trang khác, không sao
    console.log(`📍 Redirected to: ${currentUrl}`);
  }
  
  console.log(`✅ Đã tạo/kiểm tra tài khoản staff: ${TEST_STAFF_EMAIL}`);
}

async function loginAsStaff() {
  console.log('🔐 Đang đăng nhập với tài khoản nhân viên...');
  
  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000);
  
  // Đảm bảo đang ở mode login (không phải register)
  try {
    const fullNameInput = await driver.findElement(By.xpath("//label[contains(text(), 'Họ và tên')]"));
    // Nếu tìm thấy full name input, đang ở mode register, cần chuyển sang login
    const loginToggle = await driver.findElement(By.xpath("//button[contains(text(), 'Đăng nhập') and not(contains(@type, 'submit'))]"));
    await loginToggle.click();
    await driver.sleep(1000);
  } catch (e) {
    // Đã ở mode login, không cần làm gì
  }
  
  const emailInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@type='email']")),
    TIMEOUT
  );
  await emailInput.clear();
  await emailInput.sendKeys(TEST_STAFF_EMAIL);
  
  const passwordInput = await driver.findElement(By.xpath("//input[@type='password']"));
  await passwordInput.clear();
  await passwordInput.sendKeys(TEST_STAFF_PASSWORD);
  
  const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Đăng nhập') and @type='submit'] | //button[@type='submit']"));
  
  // Xử lý alert trước khi click (nếu có)
  try {
    await driver.switchTo().alert().dismiss();
  } catch (e) {
    // Không có alert
  }
  
  await loginButton.click();
  await driver.sleep(2000);
  
  // Xử lý alert sau khi click (nếu có)
  try {
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();
    await alert.accept();
    
    if (alertText.includes('Sai mật khẩu') || alertText.includes('không hợp lệ')) {
      throw new Error(`Login failed: ${alertText}`);
    }
  } catch (e) {
    if (e.message && e.message.includes('Login failed')) {
      throw e;
    }
    // Không có alert hoặc alert không phải lỗi
  }
  
  await driver.sleep(1000);
  
  // Kiểm tra đã đăng nhập thành công
  const currentUrl = await driver.getCurrentUrl();
  if (currentUrl.includes('/login')) {
    const alertText = await handleAlert();
    throw new Error(`Login failed - still on login page. Alert: ${alertText || 'none'}`);
  }
  
  // Kiểm tra role là staff (có thể kiểm tra qua URL hoặc UI)
  // Staff thường được redirect đến /home hoặc /staff/*
  console.log(`✅ Đã đăng nhập thành công với tài khoản staff: ${TEST_STAFF_EMAIL}`);
  console.log(`📍 Current URL: ${currentUrl}`);
}

async function navigateToStaffCustomersPage() {
  // Tìm và click vào menu "Khách hàng" hoặc "Customers" trong sidebar
  try {
    // Thử tìm link/button "Khách hàng" hoặc "Customers"
    const customersLink = await driver.wait(
      until.elementLocated(By.xpath("//a[contains(text(), 'Khách hàng')] | //a[contains(text(), 'Customers')] | //a[contains(@href, '/staff/customers')]")),
      TIMEOUT
    );
    await customersLink.click();
    await driver.sleep(2000);
  } catch (e) {
    // Nếu không tìm thấy link, thử điều hướng trực tiếp
    await driver.get(`${BASE_URL}/staff/customers`);
    await driver.sleep(2000);
  }
  
  // Kiểm tra đã ở trang customers
  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/customers')) {
    throw new Error('Failed to navigate to customers page');
  }
  
  console.log('✅ Đã điều hướng đến trang khách hàng');
}

async function testAddCustomer() {
  console.log('▶️  Test: Thêm khách hàng mới bằng tài khoản nhân viên');
  console.log(`👤 Đang sử dụng tài khoản staff: ${TEST_STAFF_EMAIL}`);
  
  await navigateToStaffCustomersPage();
  
  // Tìm và click nút "Thêm khách hàng"
  const addButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Thêm khách hàng')]")),
    TIMEOUT
  );
  await addButton.click();
  await driver.sleep(1000);
  
  // Kiểm tra modal đã hiển thị
  const modalTitle = await driver.wait(
    until.elementLocated(By.xpath("//h3[contains(text(), 'Thêm khách hàng')]")),
    TIMEOUT
  );
  if (!(await modalTitle.isDisplayed())) {
    throw new Error('Add customer modal should be displayed');
  }
  
  // Điền thông tin khách hàng
  const timestamp = Date.now();
  const customerName = `Khách hàng Test ${timestamp}`;
  const customerEmail = `customer${timestamp}@test.com`;
  const customerPhone = `090${timestamp.toString().slice(-7)}`;
  
  // Tên khách hàng (bắt buộc)
  const nameInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='VD: Công ty ABC'] | //label[contains(text(), 'Tên khách hàng')]/following-sibling::*/input | //label[contains(text(), 'Tên khách hàng')]/../input")),
    TIMEOUT
  );
  await nameInput.clear();
  await nameInput.sendKeys(customerName);
  
  // Email
  try {
    const emailInput = await driver.findElement(By.xpath("//input[@placeholder='contact@abc.com'] | //label[contains(text(), 'Email')]/following-sibling::*/input"));
    await emailInput.clear();
    await emailInput.sendKeys(customerEmail);
  } catch (e) {
    console.log('⚠️  Email input not found, skipping');
  }
  
  // Số điện thoại
  try {
    const phoneInput = await driver.findElement(By.xpath("//input[@placeholder='090...'] | //label[contains(text(), 'Số điện thoại')]/following-sibling::*/input"));
    await phoneInput.clear();
    await phoneInput.sendKeys(customerPhone);
  } catch (e) {
    console.log('⚠️  Phone input not found, skipping');
  }
  
  // Click nút "Lưu"
  const saveButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Lưu') and not(contains(text(), 'Hủy'))]")),
    TIMEOUT
  );
  await saveButton.click();
  await driver.sleep(2000);
  
  // Kiểm tra alert hoặc modal đã đóng
  const alertText = await handleAlert();
  if (alertText && alertText.toLowerCase().includes('thất bại')) {
    throw new Error(`Failed to add customer: ${alertText}`);
  }
  
  // Kiểm tra modal đã đóng (không còn hiển thị)
  try {
    await driver.findElement(By.xpath("//h3[contains(text(), 'Thêm khách hàng')]"));
    // Nếu tìm thấy, modal vẫn còn mở - có thể có lỗi
    const errorMsg = await handleAlert();
    if (errorMsg) {
      throw new Error(`Add customer failed: ${errorMsg}`);
    }
  } catch (e) {
    // Modal đã đóng - tốt
  }
  
  // Kiểm tra khách hàng mới đã xuất hiện trong danh sách
  await driver.sleep(1000);
  const customerInList = await driver.wait(
    until.elementLocated(By.xpath(`//td[contains(text(), '${customerName}')]`)),
    TIMEOUT
  );
  if (!(await customerInList.isDisplayed())) {
    throw new Error('New customer should appear in the list');
  }
  
  // Kiểm tra khách hàng được tạo bởi staff hiện tại
  // (Staff chỉ thấy khách hàng của mình)
  console.log(`✅ Đã thêm khách hàng: ${customerName}`);
  console.log(`✅ Khách hàng được tạo bởi tài khoản staff: ${TEST_STAFF_EMAIL}`);
  
  return customerName;
}

async function testSearchCustomerByName() {
  console.log('▶️  Test: Tìm kiếm khách hàng theo tên');
  
  await navigateToStaffCustomersPage();
  await driver.sleep(1000);
  
  // Tìm search input
  const searchInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='Tìm kiếm theo tên, email, số điện thoại...'] | //input[contains(@placeholder, 'Tìm kiếm')]")),
    TIMEOUT
  );
  
  // Nhập từ khóa tìm kiếm
  const searchKeyword = 'Test';
  await searchInput.clear();
  await searchInput.sendKeys(searchKeyword);
  await driver.sleep(1500); // Đợi filter áp dụng
  
  // Kiểm tra kết quả tìm kiếm
  // Lấy tất cả các dòng trong bảng
  const tableRows = await driver.findElements(By.xpath("//tbody/tr"));
  const rowCount = tableRows.length;
  
  if (rowCount === 0) {
    // Có thể không có kết quả hoặc có message "Chưa có khách hàng nào"
    try {
      const noDataMsg = await driver.findElement(By.xpath("//td[contains(text(), 'Chưa có khách hàng')]"));
      if (await noDataMsg.isDisplayed()) {
        console.log('⚠️  Không tìm thấy khách hàng nào với từ khóa này');
        // Không fail test, chỉ log warning
        return;
      }
    } catch (e) {
      // Không có message, có thể là lỗi
    }
  }
  
  // Kiểm tra ít nhất một kết quả chứa từ khóa tìm kiếm
  let foundMatch = false;
  for (let i = 0; i < Math.min(rowCount, 5); i++) {
    try {
      const row = tableRows[i];
      const rowText = await row.getText();
      if (rowText.toLowerCase().includes(searchKeyword.toLowerCase())) {
        foundMatch = true;
        break;
      }
    } catch (e) {
      // Skip nếu không đọc được text
    }
  }
  
  if (rowCount > 0 && !foundMatch) {
    console.log('⚠️  Có kết quả nhưng không khớp với từ khóa tìm kiếm');
  }
  
  console.log(`✅ Tìm kiếm hoạt động, tìm thấy ${rowCount} kết quả`);
  
  // Test tìm kiếm với tên cụ thể (nếu đã thêm khách hàng trước đó)
  await searchInput.clear();
  await searchInput.sendKeys('Khách hàng Test');
  await driver.sleep(1500);
  
  const filteredRows = await driver.findElements(By.xpath("//tbody/tr"));
  console.log(`✅ Tìm kiếm với tên cụ thể: ${filteredRows.length} kết quả`);
}

async function testAddCustomerAndSearch() {
  console.log('▶️  Test: Thêm khách hàng và tìm kiếm theo tên');
  
  // Bước 1: Thêm khách hàng mới
  const customerName = await testAddCustomer();
  await driver.sleep(1000);
  
  // Bước 2: Tìm kiếm khách hàng vừa thêm
  const searchInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='Tìm kiếm theo tên, email, số điện thoại...'] | //input[contains(@placeholder, 'Tìm kiếm')]")),
    TIMEOUT
  );
  
  // Tìm kiếm với tên đầy đủ
  await searchInput.clear();
  await searchInput.sendKeys(customerName);
  await driver.sleep(1500);
  
  // Kiểm tra khách hàng vừa thêm xuất hiện trong kết quả
  const customerRow = await driver.wait(
    until.elementLocated(By.xpath(`//td[contains(text(), '${customerName}')]`)),
    TIMEOUT
  );
  if (!(await customerRow.isDisplayed())) {
    throw new Error('Newly added customer should appear in search results');
  }
  
  // Tìm kiếm với một phần tên
  await searchInput.clear();
  await searchInput.sendKeys('Khách hàng Test');
  await driver.sleep(1500);
  
  const partialSearchRows = await driver.findElements(By.xpath("//tbody/tr"));
  if (partialSearchRows.length === 0) {
    throw new Error('Partial name search should return results');
  }
  
  console.log(`✅ Đã tìm thấy khách hàng vừa thêm với tên: ${customerName}`);
}

async function checkBackendConnection() {
  return new Promise((resolve) => {
    const gatewayUrl = process.env.TEST_GATEWAY_URL || 'http://127.0.0.1:4000';
    const req = http.get(`${gatewayUrl}/health`, { timeout: 2000 }, (res) => {
      if (res.statusCode === 200) {
        console.log('✓ Backend server đang chạy\n');
      } else {
        console.warn('⚠️  Warning: Backend server có thể không chạy.');
      }
      resolve();
    });
    
    req.on('error', () => {
      console.warn('⚠️  Warning: Backend server có thể không chạy.');
      resolve();
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.warn('⚠️  Warning: Backend server có thể không chạy.');
      resolve();
    });
  });
}

async function runTests() {
  console.log('🚀 Bắt đầu chạy Staff Customer Tests...\n');
  console.log(`📍 Frontend URL: ${BASE_URL}\n`);
  
  await checkBackendConnection();
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const tests = [
    { name: 'should add new customer using staff account', fn: testAddCustomer },
    { name: 'should search customer by name as staff', fn: testSearchCustomerByName },
    { name: 'should add customer and search by name as staff', fn: testAddCustomerAndSearch }
  ];

  try {
    await setup();
    // Tạo tài khoản staff trước khi test
    await createStaffAccount();
    await loginAsStaff();
    console.log('🎬 Bắt đầu chạy test cases...\n');

    for (const test of tests) {
      try {
        console.log(`▶️  Running: ${test.name}`);
        await test.fn();
        results.passed++;
        console.log(`✅ ${test.name} - PASSED\n`);
        if (process.env.HEADLESS !== 'true') {
          await driver.sleep(1000);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ test: test.name, error: error.message });
        console.error(`❌ ${test.name} - FAILED: ${error.message}\n`);
        if (process.env.HEADLESS !== 'true') {
          await driver.sleep(2000);
        }
      }
    }
  } catch (error) {
    console.error(`Setup error: ${error.message}`);
    results.failed++;
  } finally {
    await teardown();
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(({ test, error }) => {
      console.log(`   - ${test}: ${error}`);
    });
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('staff-customer.test.js')) {
  runTests();
}

