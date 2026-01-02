import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import http from 'http';

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';
const TIMEOUT = 10000;

let driver;

async function setup() {
  const options = new ChromeOptions();
  if (process.env.HEADLESS === 'true') {
    options.addArguments('--headless');
  }
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--window-size=1920,1080');
  // Disable alerts/notifications that might interfere
  options.setUserPreferences({
    'profile.default_content_setting_values.notifications': 2
  });

  driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

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
    // Ignore if can't setup alert handler
  }
}

async function teardown() {
  if (driver) {
    await driver.quit();
  }
}

async function testOpenRegistrationForm() {
  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000);

  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/login')) {
    throw new Error(`Expected to be on /login, but was on ${currentUrl}`);
  }

  const registerLink = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đăng ký ngay')]")),
    TIMEOUT
  );
  await registerLink.click();
  await driver.sleep(500);

  const fullNameInput = await driver.findElement(By.xpath("//input[@placeholder='Nguyễn Văn A']"));
  if (!(await fullNameInput.isDisplayed())) {
    throw new Error('Fulll name input should be displayed in registration mode');
  }
}

async function handleAlert() {
  try {
    const alert = await driver.switchTo().alert();
    const alertText = await alert.getText();
    await alert.accept();
    return alertText;
  } catch (e) {
    // No alert present, check for alert in window
    try {
      const alertText = await driver.executeScript('return window.lastAlert || null;');
      if (alertText) {
        await driver.executeScript('window.lastAlert = null;');
        return alertText;
      }
    } catch (e2) {
      // Ignore
    }
    return null;
  }
}

async function testRegisterAndLogin() {
  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000);

  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testPassword = 'password123';
  const testFullName = 'Test User';

  // Switch to registration mode
  const registerLink = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đăng ký ngay')]")),
    TIMEOUT
  );
  await registerLink.click();
  await driver.sleep(500);

  // Fill registration form
  const fullNameInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@placeholder='Nguyễn Văn A']")),
    TIMEOUT
  );
  await fullNameInput.sendKeys(testFullName);

  const emailInput = await driver.findElement(By.xpath("//input[@type='email']"));
  await emailInput.clear();
  await emailInput.sendKeys(testEmail);

  const passwordInputs = await driver.findElements(By.xpath("//input[@type='password']"));
  if (passwordInputs.length < 2) {
    throw new Error('Expected at least 2 password inputs in registration form');
  }
  await passwordInputs[0].sendKeys(testPassword);
  await passwordInputs[1].sendKeys(testPassword);

  // Submit form
  const submitButton = await driver.findElement(By.xpath("//button[contains(text(), 'Đăng ký')]"));
  await submitButton.click();

  // Wait for alert and handle it
  await driver.sleep(2000);
  
  // Handle any alerts that appear
  const alertText = await handleAlert();
  if (alertText && alertText.includes('504')) {
    throw new Error('Backend server không chạy hoặc không kết nối được. Vui lòng khởi động backend services.');
  }
  
  await driver.sleep(1000);

  // Verify we're on login form now
  const loginButton = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đăng nhập')]")),
    TIMEOUT
  );
  if (!(await loginButton.isDisplayed())) {
    throw new Error('Login button should be displayed after registration');
  }

  // Now login with the newly created account
  const emailInputLogin = await driver.findElement(By.xpath("//input[@type='email']"));
  await emailInputLogin.clear();
  await emailInputLogin.sendKeys(testEmail);

  const passwordInputLogin = await driver.findElement(By.xpath("//input[@type='password']"));
  await passwordInputLogin.sendKeys(testPassword);

  await loginButton.click();

  // Wait for navigation after login
  await driver.sleep(3000);

  // Check if we're redirected to a protected page
  const currentUrl = await driver.getCurrentUrl();
  if (currentUrl.includes('/login')) {
    throw new Error('Should be redirected away from login page after successful login');
  }

  // Should be on home, customers, dashboard, or staff route
  if (!currentUrl.match(/\/(home|customers|dashboard|staff)/)) {
    throw new Error(`Unexpected redirect URL: ${currentUrl}`);
  }

  // Verify no error messages
  const pageSource = await driver.getPageSource();
  const lowerSource = pageSource.toLowerCase();
  if (lowerSource.includes('lỗi') || lowerSource.includes('error')) {
    // Check if it's just a false positive (like in button text)
    const errorElements = await driver.findElements(By.xpath("//*[contains(text(), 'lỗi') or contains(text(), 'error')]"));
    if (errorElements.length > 0) {
      throw new Error('Error message found on page after successful login');
    }
  }
}

async function testLoginSuccess() {
  // This test assumes a test user exists
  // You can create one via API or use environment variables
  const testEmail = process.env.TEST_USER_EMAIL || 'admin@gmail.com';
  const testPassword = process.env.TEST_USER_PASSWORD || 'admin123';

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

  await driver.sleep(2000);
  
  // Handle any alerts
  const alertText = await handleAlert();
  if (alertText && alertText.includes('504')) {
    throw new Error('Backend server không chạy hoặc không kết nối được. Vui lòng khởi động backend services.');
  }
  
  await driver.sleep(1000);

  const currentUrl = await driver.getCurrentUrl();
  if (currentUrl.includes('/login')) {
    throw new Error('Should be redirected away from login page');
  }

  if (!currentUrl.match(/\/(home|customers|dashboard|staff)/)) {
    throw new Error(`Unexpected redirect URL: ${currentUrl}`);
  }
}

async function testLoginWrongPassword() {
  const testEmail = process.env.TEST_USER_EMAIL || 'admin@gmail.com';
  const wrongPassword = 'wrongpassword123';

  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000);

  const emailInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@type='email']")),
    TIMEOUT
  );
  await emailInput.clear();
  await emailInput.sendKeys(testEmail);

  const passwordInput = await driver.findElement(By.xpath("//input[@type='password']"));
  await passwordInput.sendKeys(wrongPassword);

  const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Đăng nhập')]"));
  await loginButton.click();

  await driver.sleep(2000);
  
  // Handle alert (error message expected)
  await handleAlert();

  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/login')) {
    throw new Error('Should remain on login page after failed login');
  }
}

async function testLoginNonExistentEmail() {
  const nonExistentEmail = `nonexistent${Date.now()}@example.com`;
  const password = 'password123';

  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000);

  const emailInput = await driver.wait(
    until.elementLocated(By.xpath("//input[@type='email']")),
    TIMEOUT
  );
  await emailInput.clear();
  await emailInput.sendKeys(nonExistentEmail);

  const passwordInput = await driver.findElement(By.xpath("//input[@type='password']"));
  await passwordInput.sendKeys(password);

  const loginButton = await driver.findElement(By.xpath("//button[contains(text(), 'Đăng nhập')]"));
  await loginButton.click();

  await driver.sleep(2000);
  
  // Handle alert (error message expected)
  await handleAlert();

  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/login')) {
    throw new Error('Should remain on login page after failed login');
  }
}

async function testPasswordValidation() {
  await driver.get(`${BASE_URL}/login`);
  await driver.sleep(1000);

  const registerLink = await driver.wait(
    until.elementLocated(By.xpath("//button[contains(text(), 'Đăng ký ngay')]")),
    TIMEOUT
  );
  await registerLink.click();
  await driver.sleep(500);

  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const shortPassword = 'short';

  const emailInput = await driver.findElement(By.xpath("//input[@type='email']"));
  await emailInput.sendKeys(testEmail);

  const passwordInput = await driver.findElement(By.xpath("//input[@type='password' and @minlength='8']"));
  await passwordInput.sendKeys(shortPassword);

  const submitButton = await driver.findElement(By.xpath("//button[contains(text(), 'Đăng ký')]"));
  await submitButton.click();

  await driver.sleep(1000);

  const currentUrl = await driver.getCurrentUrl();
  if (!currentUrl.includes('/login')) {
    throw new Error('Should remain on login page when validation fails');
  }
}

async function checkBackendConnection() {
  // Try to check gateway health endpoint using http module
  const gatewayUrl = process.env.TEST_GATEWAY_URL || 'http://localhost:4000';
  return new Promise((resolve) => {
    const url = new URL('/health', gatewayUrl);
    const req = http.get(url, (res) => {
      if (res.statusCode === 200) {
        console.log('✓ Backend server đang chạy\n');
      } else {
        showBackendWarning();
      }
      resolve();
    });
    
    req.on('error', () => {
      showBackendWarning();
      resolve();
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      showBackendWarning();
      resolve();
    });
  });
}

function showBackendWarning() {
  console.warn('⚠️  Warning: Backend server có thể không chạy. Một số tests có thể fail.');
  console.warn('   Vui lòng đảm bảo backend services đang chạy trước khi chạy UI tests:');
  console.warn('   1. Gateway: http://localhost:4000');
  console.warn('   2. Identity Service: http://localhost:5001');
  console.warn('   3. MongoDB: đang chạy\n');
}

async function runTests() {
  console.log('🚀 Bắt đầu chạy UI Tests...\n');
  console.log(`📍 Frontend URL: ${BASE_URL}\n`);
  
  // Check backend connection
  await checkBackendConnection();
  
  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  const tests = [
    { name: 'should open registration form at correct URL', fn: testOpenRegistrationForm },
    { name: 'should register new user and navigate to login', fn: testRegisterAndLogin },
    { name: 'should login successfully with valid credentials', fn: testLoginSuccess },
    { name: 'should show error on login with wrong password', fn: testLoginWrongPassword },
    { name: 'should show error on login with non-existent email', fn: testLoginNonExistentEmail },
    { name: 'should validate password length on registration', fn: testPasswordValidation }
  ];

  try {
    await setup();

    for (const test of tests) {
      try {
        console.log(`Running: ${test.name}`);
        await test.fn();
        results.passed++;
        console.log(`✓ ${test.name}`);
      } catch (error) {
        results.failed++;
        results.errors.push({ test: test.name, error: error.message });
        console.error(`✗ ${test.name}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Setup error: ${error.message}`);
    results.failed++;
  } finally {
    await teardown();
  }

  console.log(`\nResults: ${results.passed} passed, ${results.failed} failed`);
  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(({ test, error }) => {
      console.log(`  ${test}: ${error}`);
    });
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('run-tests.js')) {
  runTests().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { runTests, setup, teardown };

