import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import http from 'http';
import axios from 'axios';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TIMEOUT = 15000;

let driver;

async function setup() {
  const options = new ChromeOptions();
  
  // Các options cơ bản - đơn giản như test-simple.js
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  
  // Chỉ headless nếu HEADLESS=true
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
  console.log('📱 Browser window sẽ hiển thị trong vài giây...');
  
  // Đợi browser hiển thị
  await driver.sleep(2000);
  
  // Mở một trang để đảm bảo browser hiển thị
  await driver.get('about:blank');
  await driver.sleep(1000);
  console.log('✅ Browser đã sẵn sàng!\n');
  
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

async function checkBackendConnection() {
  return new Promise((resolve) => {
    const gatewayUrl = process.env.TEST_GATEWAY_URL || 'http://127.0.0.1:4000';
    const req = http.get(`${gatewayUrl}/health`, { timeout: 2000 }, (res) => {
      if (res.statusCode === 200) {
        console.log('✓ Backend server đang chạy\n');
      } else {
        console.warn('⚠️  Warning: Backend server có thể không chạy. Một số tests có thể fail.');
        console.warn('   Vui lòng đảm bảo backend services đang chạy trước khi chạy UI tests:');
        console.warn('   1. Gateway: http://localhost:4000');
        console.warn('   2. Identity Service: http://localhost:5001');
        console.warn('   3. Admin HR Service: http://localhost:5003');
        console.warn('   4. MongoDB: đang chạy\n');
      }
      resolve();
    });
    
    req.on('error', () => {
      console.warn('⚠️  Warning: Backend server có thể không chạy. Một số tests có thể fail.');
      console.warn('   Vui lòng đảm bảo backend services đang chạy trước khi chạy UI tests:');
      console.warn('   1. Gateway: http://localhost:4000');
      console.warn('   2. Identity Service: http://localhost:5001');
      console.warn('   3. Admin HR Service: http://localhost:5003');
      console.warn('   4. MongoDB: đang chạy\n');
      resolve();
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      console.warn('⚠️  Warning: Backend server có thể không chạy. Một số tests có thể fail.');
      console.warn('   Vui lòng đảm bảo backend services đang chạy trước khi chạy UI tests:');
      console.warn('   1. Gateway: http://localhost:4000');
      console.warn('   2. Identity Service: http://localhost:5001');
      console.warn('   3. Admin HR Service: http://localhost:5003');
      console.warn('   4. MongoDB: đang chạy\n');
      resolve();
    });
  });
}

async function loginAsAdmin() {
  const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@gmail.com';
  const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';

  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000);

  const emailInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@type='email']")),
    TIMEOUT
  );
  await emailInput.clear();
  await emailInput.sendKeys(testEmail);

  const passwordInput = await driver.findElement(By.xpath("//input[@type='password']"));
  await passwordInput.sendKeys(testPassword);

  const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Đăng nhập')]"));
  await loginButton.click();

  await driver.sleep(3000);

  // Navigate to admin page
  await driver.get(`${BASE_URL}/admin`);
  await driver.sleep(2000);
}

async function getAuthToken() {
  const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@gmail.com';
  const testPassword = process.env.TEST_ADMIN_PASSWORD || 'admin123';
  const gatewayUrl = process.env.TEST_GATEWAY_URL || 'http://127.0.0.1:4000';
  
  try {
    const response = await axios.post(`${gatewayUrl}/api/auth/login`, {
      email: testEmail,
      password: testPassword
    });
    
    if (response.data && response.data.token) {
      return response.data.token;
    }
    return null;
  } catch (error) {
    console.warn('⚠️  Không thể lấy auth token:', error.message);
    return null;
  }
}

async function createRandomEmployee() {
  const gatewayUrl = process.env.TEST_GATEWAY_URL || 'http://127.0.0.1:4000';
  const token = await getAuthToken();
  
  if (!token) {
    throw new Error('Không thể lấy auth token để tạo nhân viên');
  }
  
  // Tạo dữ liệu ngẫu nhiên
  const randomId = Math.floor(Math.random() * 10000);
  const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ'];
  const lastNames = ['Văn An', 'Thị Bình', 'Văn Cường', 'Thị Dung', 'Văn Em', 'Thị Giang', 'Văn Hùng', 'Thị Lan', 'Văn Minh', 'Thị Nga'];
  
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const fullName = `${firstName} ${lastName}`;
  const email = `test.employee.${randomId}@example.com`;
  const phone = `09${Math.floor(Math.random() * 100000000)}`;
  const statuses = ['Đang làm việc', 'Nghỉ phép', 'Đã nghỉ việc'];
  
  const employeeData = {
    full_name: fullName,
    email: email,
    password: 'Test123456!',
    confirm_password: 'Test123456!',
    phone: phone,
    position: 'Developer',
    department: 'IT'
  };
  
  try {
    const response = await axios.post(
      `${gatewayUrl}/api/admin/employees`,
      employeeData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.status === 201 || response.status === 200) {
      console.log(`✅ Đã tạo nhân viên: ${fullName} (${email})`);
      return response.data;
    }
    throw new Error(`Failed to create employee: ${response.status}`);
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Error creating employee: ${error.message}`);
  }
}

async function ensureEmployeesExist() {
  const count = await getEmployeeCount();
  
  if (count === 0) {
    console.log('⚠️  Không có nhân viên trong dữ liệu. Đang tạo nhân viên ngẫu nhiên...');
    
    try {
      // Tạo 3 nhân viên với các trạng thái khác nhau
      await createRandomEmployee();
      await new Promise(resolve => setTimeout(resolve, 500));
      await createRandomEmployee();
      await new Promise(resolve => setTimeout(resolve, 500));
      await createRandomEmployee();
      
      console.log('✅ Đã tạo 3 nhân viên ngẫu nhiên');
      
      // Reload trang để hiển thị nhân viên mới
      await driver.get(`${BASE_URL}/admin`);
      await driver.sleep(2000);
      
      const newCount = await getEmployeeCount();
      if (newCount === 0) {
        throw new Error('Không thể tạo nhân viên hoặc không hiển thị sau khi tạo');
      }
      
      console.log(`✅ Hiện có ${newCount} nhân viên trong dữ liệu\n`);
    } catch (error) {
      console.error('❌ Lỗi khi tạo nhân viên:', error.message);
      console.error('💡 Có thể API không khả dụng hoặc cần quyền admin');
      throw error;
    }
  } else {
    console.log(`✅ Đã có ${count} nhân viên trong dữ liệu\n`);
  }
}

async function getEmployeeCount() {
  try {
    const rows = await driver.findElements(By.xpath("//div[contains(@class, 'grid grid-cols-5') and contains(@class, 'px-6 py-5')]"));
    return rows.length;
  } catch (e) {
    return 0;
  }
}

async function getEmployeeNames() {
  try {
    const nameElements = await driver.findElements(By.xpath("//p[contains(@class, 'font-semibold text-slate-800')]"));
    const names = [];
    for (const el of nameElements) {
      const text = await el.getText();
      if (text && !text.includes('ID:') && !text.includes('Thông tin nhân viên')) {
        names.push(text);
      }
    }
    return names;
  } catch (e) {
    return [];
  }
}

async function getEmployeeEmails() {
  try {
    const emailElements = await driver.findElements(By.xpath("//p[contains(@class, 'text-sm text-slate-500')]"));
    const emails = [];
    for (const el of emailElements) {
      const text = await el.getText();
      if (text && text.includes('@')) {
        emails.push(text);
      }
    }
    return emails;
  } catch (e) {
    return [];
  }
}

async function testSearchByName() {
  await loginAsAdmin();
  
  // Đảm bảo có nhân viên trong dữ liệu
  await ensureEmployeesExist();

  const initialCount = await getEmployeeCount();

  const names = await getEmployeeNames();
  if (names.length === 0) {
    throw new Error('Không tìm thấy tên nhân viên nào');
  }

  const searchName = names[0].substring(0, Math.min(3, names[0].length));

  const searchInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='Tìm kiếm nhân viên theo tên, email...']")),
    TIMEOUT
  );
  await searchInput.clear();
  await searchInput.sendKeys(searchName);

  await driver.sleep(1000);

  const filteredNames = await getEmployeeNames();
  const found = filteredNames.some(name => name.toLowerCase().includes(searchName.toLowerCase()));

  if (!found && filteredNames.length > 0) {
    throw new Error(`Không tìm thấy nhân viên có tên chứa "${searchName}"`);
  }

  await searchInput.clear();
  await driver.sleep(500);
}

async function testSearchByEmail() {
  await loginAsAdmin();
  
  // Đảm bảo có nhân viên trong dữ liệu
  await ensureEmployeesExist();

  const emails = await getEmployeeEmails();
  if (emails.length === 0) {
    throw new Error('Không tìm thấy email nhân viên nào');
  }

  const searchEmail = emails[0].substring(0, emails[0].indexOf('@'));

  const searchInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='Tìm kiếm nhân viên theo tên, email...']")),
    TIMEOUT
  );
  await searchInput.clear();
  await searchInput.sendKeys(searchEmail);

  await driver.sleep(1000);

  const filteredEmails = await getEmployeeEmails();
  const found = filteredEmails.some(email => email.toLowerCase().includes(searchEmail.toLowerCase()));

  if (!found && filteredEmails.length > 0) {
    throw new Error(`Không tìm thấy nhân viên có email chứa "${searchEmail}"`);
  }

  await searchInput.clear();
  await driver.sleep(500);
}

async function testFilterByStatus() {
  await loginAsAdmin();
  
  // Đảm bảo có nhân viên trong dữ liệu
  await ensureEmployeesExist();

  const initialCount = await getEmployeeCount();

  const filterButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Bộ lọc:')]")),
    TIMEOUT
  );
  await filterButton.click();
  await driver.sleep(500);

  const workingOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đang làm việc')]")),
    TIMEOUT
  );
  await workingOption.click();
  await driver.sleep(1000);

  const filterButtonText = await filterButton.getText();
  if (!filterButtonText.includes('Đang làm việc')) {
    throw new Error('Filter "Đang làm việc" không được áp dụng');
  }

  await filterButton.click();
  await driver.sleep(500);
  const allOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Tất cả')]")),
    TIMEOUT
  );
  await allOption.click();
  await driver.sleep(1000);

  const resetButtonText = await filterButton.getText();
  if (!resetButtonText.includes('Tất cả')) {
    throw new Error('Filter không được reset về "Tất cả"');
  }
}

async function testFilterByStatusWorking() {
  await loginAsAdmin();
  
  // Đảm bảo có nhân viên trong dữ liệu
  await ensureEmployeesExist();

  const filterButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Bộ lọc:')]")),
    TIMEOUT
  );
  await filterButton.click();
  await driver.sleep(500);

  const workingOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đang làm việc')]")),
    TIMEOUT
  );
  await workingOption.click();
  await driver.sleep(1000);

  const totalRows = await getEmployeeCount();
  let count = 0;
  const statusElements = await driver.findElements(By.xpath("//span[contains(@class, 'px-2') and contains(@class, 'py-1')]"));
  for (const el of statusElements) {
    const text = await el.getText();
    if (text.includes('Đang làm việc')) {
      count++;
    }
  }

  if (totalRows > 0 && count !== totalRows) {
    throw new Error(`Filter "Đang làm việc" không đúng: hiển thị ${totalRows} rows nhưng chỉ có ${count} có status "Đang làm việc"`);
  }

  await filterButton.click();
  await driver.sleep(500);
  const allOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Tất cả')]")),
    TIMEOUT
  );
  await allOption.click();
  await driver.sleep(1000);
}

async function testFilterByStatusLeave() {
  await loginAsAdmin();
  
  // Đảm bảo có nhân viên trong dữ liệu
  await ensureEmployeesExist();

  const filterButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Bộ lọc:')]")),
    TIMEOUT
  );
  await filterButton.click();
  await driver.sleep(500);

  const leaveOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Nghỉ phép')]")),
    TIMEOUT
  );
  await leaveOption.click();
  await driver.sleep(1000);

  const filterButtonText = await filterButton.getText();
  if (!filterButtonText.includes('Nghỉ phép')) {
    throw new Error('Filter "Nghỉ phép" không được áp dụng');
  }

  await filterButton.click();
  await driver.sleep(500);
  const allOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Tất cả')]")),
    TIMEOUT
  );
  await allOption.click();
  await driver.sleep(1000);
}

async function testFilterByStatusQuit() {
  await loginAsAdmin();
  
  // Đảm bảo có nhân viên trong dữ liệu
  await ensureEmployeesExist();

  const filterButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Bộ lọc:')]")),
    TIMEOUT
  );
  await filterButton.click();
  await driver.sleep(500);

  const quitOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đã nghỉ việc')]")),
    TIMEOUT
  );
  await quitOption.click();
  await driver.sleep(1000);

  const filterButtonText = await filterButton.getText();
  if (!filterButtonText.includes('Đã nghỉ việc')) {
    throw new Error('Filter "Đã nghỉ việc" không được áp dụng');
  }

  await filterButton.click();
  await driver.sleep(500);
  const allOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Tất cả')]")),
    TIMEOUT
  );
  await allOption.click();
  await driver.sleep(1000);
}

async function testSearchAndFilterCombined() {
  await loginAsAdmin();
  
  // Đảm bảo có nhân viên trong dữ liệu
  await ensureEmployeesExist();

  const names = await getEmployeeNames();
  if (names.length === 0) {
    throw new Error('Không tìm thấy tên nhân viên nào');
  }

  const searchName = names[0].substring(0, Math.min(3, names[0].length));

  const searchInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='Tìm kiếm nhân viên theo tên, email...']")),
    TIMEOUT
  );
  await searchInput.clear();
  await searchInput.sendKeys(searchName);
  await driver.sleep(1000);

  const afterSearchCount = await getEmployeeCount();

  const filterButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Bộ lọc:')]")),
    TIMEOUT
  );
  await filterButton.click();
  await driver.sleep(500);

  const workingOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đang làm việc')]")),
    TIMEOUT
  );
  await workingOption.click();
  await driver.sleep(1000);

  const afterFilterCount = await getEmployeeCount();

  if (afterFilterCount > afterSearchCount) {
    throw new Error(`Kết hợp search + filter không đúng: sau search có ${afterSearchCount} kết quả, sau filter có ${afterFilterCount} kết quả`);
  }

  await filterButton.click();
  await driver.sleep(500);
  const allOption = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Tất cả')]")),
    TIMEOUT
  );
  await allOption.click();
  await driver.sleep(1000);
  await searchInput.clear();
  await driver.sleep(500);
}

async function testSearchNoResults() {
  await loginAsAdmin();

  const searchInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='Tìm kiếm nhân viên theo tên, email...']")),
    TIMEOUT
  );
  await searchInput.clear();
  await searchInput.sendKeys('NONEXISTENT_USER_XYZ_12345');
  await driver.sleep(1000);

  const count = await getEmployeeCount();
  if (count > 0) {
    throw new Error(`Tìm kiếm với từ khóa không tồn tại vẫn hiển thị ${count} kết quả`);
  }

  await searchInput.clear();
  await driver.sleep(500);
}

async function runTests() {
  console.log('🚀 Bắt đầu chạy Admin Search & Filter Tests...\n');
  console.log(`📍 Frontend URL: ${BASE_URL}\n`);
  
  await checkBackendConnection();
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const tests = [
    { name: 'should search employees by name', fn: testSearchByName },
    { name: 'should search employees by email', fn: testSearchByEmail },
    { name: 'should filter by status (all options)', fn: testFilterByStatus },
    { name: 'should filter by status "Đang làm việc"', fn: testFilterByStatusWorking },
    { name: 'should filter by status "Nghỉ phép"', fn: testFilterByStatusLeave },
    { name: 'should filter by status "Đã nghỉ việc"', fn: testFilterByStatusQuit },
    { name: 'should combine search and filter', fn: testSearchAndFilterCombined },
    { name: 'should show no results message when search has no matches', fn: testSearchNoResults }
  ];

  try {
    await setup();
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
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('admin-search-filter.test.js')) {
  runTests();
}
