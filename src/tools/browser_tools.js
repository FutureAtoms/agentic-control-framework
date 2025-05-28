const { chromium, firefox, webkit } = require('playwright');
const path = require('path');
const fs = require('fs');
const logger = require('../logger');

// Browser instance management
let browser = null;
let context = null;
let page = null;
let currentBrowserType = 'chromium';

// Configuration
const config = {
  headless: process.env.BROWSER_HEADLESS === 'true',
  timeout: parseInt(process.env.BROWSER_TIMEOUT || '30000'),
  userDataDir: process.env.BROWSER_USER_DATA_DIR || null
};

/**
 * Get or create browser instance
 */
async function getBrowser() {
  if (!browser || !browser.isConnected()) {
    await launchBrowser();
  }
  return browser;
}

/**
 * Launch browser
 */
async function launchBrowser() {
  try {
    // Close existing browser if any
    if (browser) {
      await browser.close().catch(() => {});
    }

    // Select browser type
    let browserLauncher;
    switch (currentBrowserType) {
      case 'firefox':
        browserLauncher = firefox;
        break;
      case 'webkit':
        browserLauncher = webkit;
        break;
      default:
        browserLauncher = chromium;
    }

    // Launch options
    const launchOptions = {
      headless: config.headless,
      timeout: config.timeout
    };

    // Add user data dir if specified
    if (config.userDataDir) {
      const userDataPath = path.resolve(config.userDataDir);
      if (!fs.existsSync(userDataPath)) {
        fs.mkdirSync(userDataPath, { recursive: true });
      }
      launchOptions.userDataDir = userDataPath;
    }

    // Launch browser
    browser = await browserLauncher.launch(launchOptions);
    
    // Create context
    context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'ACF-Browser/1.0'
    });

    // Create initial page
    page = await context.newPage();

    logger.info(`Browser launched: ${currentBrowserType}, headless: ${config.headless}`);
    
    return browser;
  } catch (error) {
    logger.error(`Error launching browser: ${error.message}`);
    throw error;
  }
}

/**
 * Get current page or create new one
 */
async function getPage() {
  if (!page || page.isClosed()) {
    const browser = await getBrowser();
    if (!context) {
      context = await browser.newContext();
    }
    page = await context.newPage();
  }
  return page;
}

/**
 * Navigate to a URL
 */
async function browserNavigate(url) {
  try {
    if (!url) {
      return {
        success: false,
        message: 'URL is required'
      };
    }

    const page = await getPage();
    
    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: config.timeout
    });

    return {
      success: true,
      message: `Navigated to ${url}`,
      url: page.url(),
      title: await page.title()
    };

  } catch (error) {
    logger.error(`Error navigating: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Go back to previous page
 */
async function browserNavigateBack() {
  try {
    const page = await getPage();
    
    const response = await page.goBack({
      waitUntil: 'domcontentloaded',
      timeout: config.timeout
    });

    if (!response) {
      return {
        success: false,
        message: 'No previous page in history'
      };
    }

    return {
      success: true,
      message: 'Navigated back',
      url: page.url(),
      title: await page.title()
    };

  } catch (error) {
    logger.error(`Error navigating back: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Go forward to next page
 */
async function browserNavigateForward() {
  try {
    const page = await getPage();
    
    const response = await page.goForward({
      waitUntil: 'domcontentloaded',
      timeout: config.timeout
    });

    if (!response) {
      return {
        success: false,
        message: 'No next page in history'
      };
    }

    return {
      success: true,
      message: 'Navigated forward',
      url: page.url(),
      title: await page.title()
    };

  } catch (error) {
    logger.error(`Error navigating forward: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Click on an element
 */
async function browserClick(element, ref) {
  try {
    if (!ref) {
      return {
        success: false,
        message: 'Element reference (ref) is required'
      };
    }

    const page = await getPage();
    
    // Click the element
    await page.click(ref, {
      timeout: config.timeout
    });

    return {
      success: true,
      message: `Clicked on ${element}`,
      element,
      ref
    };

  } catch (error) {
    logger.error(`Error clicking element: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Type text into an element
 */
async function browserType(element, ref, text, options = {}) {
  try {
    if (!ref || text === undefined) {
      return {
        success: false,
        message: 'Element reference (ref) and text are required'
      };
    }

    const page = await getPage();
    
    // Clear existing text first
    await page.fill(ref, '', { timeout: config.timeout });
    
    // Type the text
    if (options.slowly) {
      await page.type(ref, text, {
        delay: 50, // 50ms between keystrokes
        timeout: config.timeout
      });
    } else {
      await page.fill(ref, text, {
        timeout: config.timeout
      });
    }

    // Submit if requested
    if (options.submit) {
      await page.press(ref, 'Enter');
    }

    return {
      success: true,
      message: `Typed text into ${element}`,
      element,
      ref,
      textLength: text.length
    };

  } catch (error) {
    logger.error(`Error typing text: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Hover over an element
 */
async function browserHover(element, ref) {
  try {
    if (!ref) {
      return {
        success: false,
        message: 'Element reference (ref) is required'
      };
    }

    const page = await getPage();
    
    await page.hover(ref, {
      timeout: config.timeout
    });

    return {
      success: true,
      message: `Hovered over ${element}`,
      element,
      ref
    };

  } catch (error) {
    logger.error(`Error hovering: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Drag and drop between elements
 */
async function browserDrag(startElement, startRef, endElement, endRef) {
  try {
    if (!startRef || !endRef) {
      return {
        success: false,
        message: 'Both start and end element references are required'
      };
    }

    const page = await getPage();
    
    await page.dragAndDrop(startRef, endRef, {
      timeout: config.timeout
    });

    return {
      success: true,
      message: `Dragged from ${startElement} to ${endElement}`,
      startElement,
      startRef,
      endElement,
      endRef
    };

  } catch (error) {
    logger.error(`Error dragging: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Select option(s) in a dropdown
 */
async function browserSelectOption(element, ref, values) {
  try {
    if (!ref || !values || !Array.isArray(values)) {
      return {
        success: false,
        message: 'Element reference (ref) and values array are required'
      };
    }

    const page = await getPage();
    
    await page.selectOption(ref, values, {
      timeout: config.timeout
    });

    return {
      success: true,
      message: `Selected ${values.length} option(s) in ${element}`,
      element,
      ref,
      values
    };

  } catch (error) {
    logger.error(`Error selecting option: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Press a keyboard key
 */
async function browserPressKey(key) {
  try {
    if (!key) {
      return {
        success: false,
        message: 'Key is required'
      };
    }

    const page = await getPage();
    
    await page.keyboard.press(key);

    return {
      success: true,
      message: `Pressed key: ${key}`,
      key
    };

  } catch (error) {
    logger.error(`Error pressing key: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Take a screenshot
 */
async function browserTakeScreenshot(options = {}) {
  try {
    const page = await getPage();
    
    const screenshotOptions = {
      type: options.raw ? 'png' : 'jpeg',
      quality: options.raw ? undefined : 80,
      fullPage: false
    };

    // If element is specified, screenshot that element
    if (options.ref) {
      const element = await page.$(options.ref);
      if (!element) {
        return {
          success: false,
          message: 'Element not found for screenshot'
        };
      }
      const buffer = await element.screenshot(screenshotOptions);
      return {
        success: true,
        message: 'Screenshot taken',
        content: buffer.toString('base64'),
        mimeType: `image/${screenshotOptions.type}`,
        element: options.element
      };
    }

    // Otherwise screenshot the viewport
    const buffer = await page.screenshot(screenshotOptions);

    return {
      success: true,
      message: 'Screenshot taken',
      content: buffer.toString('base64'),
      mimeType: `image/${screenshotOptions.type}`
    };

  } catch (error) {
    logger.error(`Error taking screenshot: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get accessibility snapshot
 */
async function browserSnapshot() {
  try {
    const page = await getPage();
    
    // Get accessibility tree
    const snapshot = await page.accessibility.snapshot();

    return {
      success: true,
      message: 'Accessibility snapshot captured',
      snapshot,
      url: page.url(),
      title: await page.title()
    };

  } catch (error) {
    logger.error(`Error getting snapshot: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Save page as PDF
 */
async function browserPdfSave(options = {}) {
  try {
    const page = await getPage();
    
    const pdfOptions = {
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    };

    const buffer = await page.pdf(pdfOptions);
    
    // Save to file if filename provided
    if (options.filename) {
      const filePath = path.resolve(options.filename);
      fs.writeFileSync(filePath, buffer);
      
      return {
        success: true,
        message: `PDF saved to ${filePath}`,
        path: filePath,
        size: buffer.length
      };
    }

    return {
      success: true,
      message: 'PDF generated',
      content: buffer.toString('base64'),
      mimeType: 'application/pdf',
      size: buffer.length
    };

  } catch (error) {
    logger.error(`Error saving PDF: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get console messages
 */
async function browserConsoleMessages() {
  try {
    const page = await getPage();
    
    // Set up console message collection if not already done
    if (!page._consoleMessages) {
      page._consoleMessages = [];
      page.on('console', msg => {
        page._consoleMessages.push({
          type: msg.type(),
          text: msg.text(),
          location: msg.location(),
          timestamp: new Date().toISOString()
        });
      });
    }

    return {
      success: true,
      messages: page._consoleMessages || [],
      count: (page._consoleMessages || []).length
    };

  } catch (error) {
    logger.error(`Error getting console messages: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Upload files
 */
async function browserFileUpload(paths) {
  try {
    if (!paths || !Array.isArray(paths)) {
      return {
        success: false,
        message: 'File paths array is required'
      };
    }

    const page = await getPage();
    
    // Find file input
    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) {
      return {
        success: false,
        message: 'No file input found on page'
      };
    }

    // Resolve paths
    const resolvedPaths = paths.map(p => path.resolve(p));
    
    // Check if files exist
    for (const filePath of resolvedPaths) {
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          message: `File not found: ${filePath}`
        };
      }
    }

    // Upload files
    await fileInput.setInputFiles(resolvedPaths);

    return {
      success: true,
      message: `Uploaded ${paths.length} file(s)`,
      paths: resolvedPaths
    };

  } catch (error) {
    logger.error(`Error uploading files: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Wait for specified time
 */
async function browserWait(time) {
  try {
    if (!time || isNaN(time)) {
      return {
        success: false,
        message: 'Time in seconds is required'
      };
    }

    // Cap at 10 seconds
    const waitTime = Math.min(time, 10) * 1000;
    
    const page = await getPage();
    await page.waitForTimeout(waitTime);

    return {
      success: true,
      message: `Waited for ${waitTime / 1000} seconds`
    };

  } catch (error) {
    logger.error(`Error waiting: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Resize browser window
 */
async function browserResize(width, height) {
  try {
    if (!width || !height || isNaN(width) || isNaN(height)) {
      return {
        success: false,
        message: 'Valid width and height are required'
      };
    }

    const page = await getPage();
    await page.setViewportSize({ width, height });

    return {
      success: true,
      message: `Resized browser to ${width}x${height}`,
      width,
      height
    };

  } catch (error) {
    logger.error(`Error resizing: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Handle browser dialogs
 */
async function browserHandleDialog(accept, promptText) {
  try {
    const page = await getPage();
    
    // Set up dialog handler
    page.once('dialog', async dialog => {
      if (accept) {
        await dialog.accept(promptText || '');
      } else {
        await dialog.dismiss();
      }
    });

    return {
      success: true,
      message: `Dialog handler set: ${accept ? 'accept' : 'dismiss'}`,
      accept,
      promptText
    };

  } catch (error) {
    logger.error(`Error handling dialog: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Close the page
 */
async function browserClose() {
  try {
    if (page && !page.isClosed()) {
      await page.close();
      page = null;
    }

    return {
      success: true,
      message: 'Page closed'
    };

  } catch (error) {
    logger.error(`Error closing page: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Install browser
 */
async function browserInstall() {
  try {
    const { installBrowsersWithProgressBar } = require('playwright/lib/install/installer');
    
    await installBrowsersWithProgressBar([currentBrowserType]);

    return {
      success: true,
      message: `Browser ${currentBrowserType} installed successfully`
    };

  } catch (error) {
    logger.error(`Error installing browser: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * List browser tabs
 */
async function browserTabList() {
  try {
    const browser = await getBrowser();
    const pages = context ? context.pages() : [];

    const tabs = pages.map((p, index) => ({
      index,
      url: p.url(),
      title: p.title(),
      active: p === page
    }));

    return {
      success: true,
      tabs,
      count: tabs.length
    };

  } catch (error) {
    logger.error(`Error listing tabs: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Open new tab
 */
async function browserTabNew(url) {
  try {
    const browser = await getBrowser();
    if (!context) {
      context = await browser.newContext();
    }

    const newPage = await context.newPage();
    
    if (url) {
      await newPage.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: config.timeout
      });
    }

    // Switch to new tab
    page = newPage;

    const pages = context.pages();
    const newIndex = pages.indexOf(newPage);

    return {
      success: true,
      message: 'New tab opened',
      index: newIndex,
      url: newPage.url()
    };

  } catch (error) {
    logger.error(`Error opening new tab: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Select a tab by index
 */
async function browserTabSelect(index) {
  try {
    if (index === undefined || isNaN(index)) {
      return {
        success: false,
        message: 'Tab index is required'
      };
    }

    const browser = await getBrowser();
    const pages = context ? context.pages() : [];

    if (index < 0 || index >= pages.length) {
      return {
        success: false,
        message: `Invalid tab index: ${index}. Valid range: 0-${pages.length - 1}`
      };
    }

    page = pages[index];
    await page.bringToFront();

    return {
      success: true,
      message: `Switched to tab ${index}`,
      index,
      url: page.url(),
      title: await page.title()
    };

  } catch (error) {
    logger.error(`Error selecting tab: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Close a tab
 */
async function browserTabClose(index) {
  try {
    const browser = await getBrowser();
    const pages = context ? context.pages() : [];

    // If no index specified, close current tab
    if (index === undefined) {
      if (page && !page.isClosed()) {
        await page.close();
        
        // Switch to another tab if available
        const remainingPages = context.pages();
        if (remainingPages.length > 0) {
          page = remainingPages[remainingPages.length - 1];
        } else {
          page = null;
        }
        
        return {
          success: true,
          message: 'Current tab closed'
        };
      }
    } else {
      // Close tab by index
      if (index < 0 || index >= pages.length) {
        return {
          success: false,
          message: `Invalid tab index: ${index}`
        };
      }

      await pages[index].close();
      
      // If we closed the current page, switch to another
      if (pages[index] === page) {
        const remainingPages = context.pages();
        if (remainingPages.length > 0) {
          page = remainingPages[Math.min(index, remainingPages.length - 1)];
        } else {
          page = null;
        }
      }

      return {
        success: true,
        message: `Tab ${index} closed`
      };
    }

  } catch (error) {
    logger.error(`Error closing tab: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Wait for text or time
 */
async function browserWaitFor(options = {}) {
  try {
    const page = await getPage();
    
    if (options.text) {
      // Wait for text to appear
      await page.waitForSelector(`text=${options.text}`, {
        timeout: config.timeout
      });
      
      return {
        success: true,
        message: `Found text: ${options.text}`
      };
    } else if (options.textGone) {
      // Wait for text to disappear
      await page.waitForSelector(`text=${options.textGone}`, {
        state: 'hidden',
        timeout: config.timeout
      });
      
      return {
        success: true,
        message: `Text disappeared: ${options.textGone}`
      };
    } else if (options.time) {
      // Wait for specified time
      const waitTime = Math.min(options.time, 10) * 1000;
      await page.waitForTimeout(waitTime);
      
      return {
        success: true,
        message: `Waited for ${waitTime / 1000} seconds`
      };
    } else {
      return {
        success: false,
        message: 'Must specify text, textGone, or time to wait for'
      };
    }

  } catch (error) {
    logger.error(`Error waiting: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Network request monitoring
 */
async function browserNetworkRequests() {
  try {
    const page = await getPage();
    
    // Set up request monitoring if not already done
    if (!page._networkRequests) {
      page._networkRequests = [];
      
      page.on('request', request => {
        page._networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData(),
          timestamp: new Date().toISOString(),
          type: 'request'
        });
      });
      
      page.on('response', response => {
        page._networkRequests.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText(),
          headers: response.headers(),
          timestamp: new Date().toISOString(),
          type: 'response'
        });
      });
    }

    return {
      success: true,
      requests: page._networkRequests || [],
      count: (page._networkRequests || []).length
    };

  } catch (error) {
    logger.error(`Error getting network requests: ${error.message}`);
    return {
      success: false,
      message: error.message
    };
  }
}

// Clean up on exit
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close().catch(() => {});
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close().catch(() => {});
  }
  process.exit(0);
});

module.exports = {
  // Navigation
  browserNavigate,
  browserNavigateBack,
  browserNavigateForward,
  
  // Interaction
  browserClick,
  browserType,
  browserHover,
  browserDrag,
  browserSelectOption,
  browserPressKey,
  
  // Capture
  browserTakeScreenshot,
  browserSnapshot,
  browserPdfSave,
  
  // Tab management
  browserTabList,
  browserTabNew,
  browserTabSelect,
  browserTabClose,
  
  // Utilities
  browserConsoleMessages,
  browserFileUpload,
  browserWait,
  browserWaitFor,
  browserResize,
  browserHandleDialog,
  browserClose,
  browserInstall,
  browserNetworkRequests
};
