import { test, expect } from '@playwright/test';
import { randomUUID } from 'crypto';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display landing page correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Сто к Одному');
    await expect(page.locator('button:has-text("Создать игру")')).toBeVisible();
  });

  test('should create a new game', async ({ page }) => {
    const createButton = page.locator('button:has-text("Создать игру")');
    await createButton.click();

    const packSelector = page.locator('[data-testid="pack-selector"]');
    await expect(packSelector).toBeVisible();

    const startButton = page.locator('button:has-text("Начать игру")');
    await startButton.click();

    await page.waitForTimeout(1000);

    const roomId = await page.locator('[data-testid="room-id"]').textContent();
    expect(roomId).toMatch(/^[A-Z0-9]{4}$/);
  });

  test('should join existing game with room code', async ({ page }) => {
    const joinButton = page.locator('button:has-text("Присоединиться к игре")');
    await joinButton.click();

    const roomIdInput = page.locator('[data-testid="room-id-input"]');
    await expect(roomIdInput).toBeVisible();
    await roomIdInput.fill('TEST');

    const roleButtons = [
      { name: 'Tablo', value: 'board' },
      { name: 'Admin', value: 'admin' },
      { name: 'Buzzer', value: 'buzzer' }
    ];

    for (const role of roleButtons) {
      const roleButton = page.locator(`button:has-text("${role.name}")`);
      await expect(roleButton).toBeVisible();
    }
  });
});

test.describe('Game Room Creation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should create room and get room code', async ({ page }) => {
    await page.click('button:has-text("Создать game")');
    await page.waitForTimeout(500);

    const packId = page.locator('[data-testid="pack-select"]');
    await packId.selectOption('pack1');

    await page.click('button:has-text("Начать игру")');
    await page.waitForTimeout(1000);

    const roomCode = page.locator('[data-testid="room-code"]');
    await expect(roomCode).toBeVisible();
  });

  test('should show QR code after room creation', async ({ page }) => {
    await page.click('button:has-text("Создать игру")');
    await page.click('button:has-text("Начать игру")');

    const qrCode = page.locator('[data-testid="qr-code"]');
    await expect(qrCode).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Board View', () => {
  test('should load board view with room code', async ({ page, context }) => {
    await page.goto('/game/TEST/board');

    await expect(page.locator('.board-container')).toBeVisible();
    await expect(page.locator('[data-testid="room-code"]')).toContainText('TEST');
  });

  test('should display game controls on board', async ({ page }) => {
    await page.goto('/game/TEST/board');

    const teamScores = page.locator('.score-box');
    await expect(teamScores).toHaveCount(2);

    const bankDisplay = page.locator('.bank-display');
    await expect(bankDisplay).toBeVisible();
  });

  test('should show game question', async ({ page }) => {
    await page.goto('/game/TEST/board');

    const questionContainer = page.locator('[data-testid="question"]');
    await expect(questionContainer).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Admin Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game/TEST/admin');
  });

  test('should load admin controls', async ({ page }) => {
    await expect(page.locator('.admin-container')).toBeVisible();
    await expect(page.locator('[data-testid="room-code"]')).toContainText('TEST');
  });

  test('should display round selector', async ({ page }) => {
    const roundButtons = page.locator('.round-btn');
    await expect(roundButtons).toHaveCount(5);
  });

  test('should reveal answers', async ({ page }) => {
    const answerButton = page.locator('.answer-btn').first();
    await expect(answerButton).toBeVisible();

    await answerButton.click();
    await page.waitForTimeout(500);

    const revealedAnswer = page.locator('.answer-item.revealed').first();
    await expect(revealedAnswer).toBeVisible();
  });

  test('should add mistakes', async ({ page }) => {
    const mistakeButton = page.locator('.mistake-btn');
    await mistakeButton.click();
    await page.waitForTimeout(500);

    const mistakesContainer = page.locator('.mistakes-container');
    await expect(mistakesContainer).toContainText('X');
  });

  test('should switch teams', async ({ page }) => {
    const teamSwitchButton = page.locator('.team-btn');
    await teamSwitchButton.click();
    await page.waitForTimeout(500);

    const activeTeam = page.locator('[data-testid="active-team"]');
    await expect(activeTeam).toBeVisible();
  });
});

test.describe('Buzzer', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/game/TEST/buzzer');
  });

  test('should load buzzer interface', async ({ page }) => {
    await expect(page.locator('.buzzer-container')).toBeVisible();
    await expect(page.locator('[data-testid="room-code"]')).toContainText('TEST');
  });

  test('should show team selection', async ({ page }) => {
    const teamButtons = page.locator('.team-btn-buzzer');
    await expect(teamButtons).toHaveCount(2);
  });

  test('should select team', async ({ page }) => {
    const team1Button = page.locator('.team-btn-buzzer.team1');
    await team1Button.click();
    await page.waitForTimeout(500);

    const selectedTeam = page.locator('.team-btn-buzzer.selected');
    await expect(selectedTeam).toBeVisible();
  });

  test('should show buzzer button after team selection', async ({ page }) => {
    const team1Button = page.locator('.team-btn-buzzer.team1');
    await team1Button.click();
    await page.waitForTimeout(1000);

    const buzzerButton = page.locator('.buzzer-button:not(.disabled)');
    await expect(buzzerButton).toBeVisible();
  });

  test('should show connection status', async ({ page }) => {
    const connectionStatus = page.locator('.connection-indicator');
    await expect(connectionStatus).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Game Flow Integration', () => {
  test('should complete full game flow', async ({ page, context }) => {
    const roomId = 'TEST';
    const adminPage = await context.newPage();
    const boardPage = await context.newPage();
    const buzzerPage = await context.newPage();

    await Promise.all([
      adminPage.goto(`/game/${roomId}/admin`),
      boardPage.goto(`/game/${roomId}/board`),
      buzzerPage.goto(`/game/${roomId}/buzzer`)
    ]);

    await Promise.all([
      expect(adminPage.locator('.admin-container')).toBeVisible({ timeout: 10000 }),
      expect(boardPage.locator('.board-container')).toBeVisible({ timeout: 10000 }),
      expect(buzzerPage.locator('.buzzer-container')).toBeVisible({ timeout: 10000 })
    ]);

    const teamButton = buzzerPage.locator('.team-btn-buzzer.team1');
    await teamButton.click();
    await buzzerPage.waitForTimeout(1000);

    const roundButton = adminPage.locator('.round-btn').first();
    await roundButton.click();
    await adminPage.waitForTimeout(1000);

    const answerButton = adminPage.locator('.answer-btn').first();
    await answerButton.click();
    await adminPage.waitForTimeout(1000);

    const revealedAnswer = boardPage.locator('.answer-item.revealed').first();
    await expect(revealedAnswer).toBeVisible({ timeout: 5000 });
  });

  test('should sync state across all views', async ({ page, context }) => {
    const roomId = 'SYNC';
    const pages = [];

    for (const role of ['admin', 'board', 'buzzer']) {
      const newPage = await context.newPage();
      await newPage.goto(`/game/${roomId}/${role}`);
      pages.push(newPage);
    }

    await Promise.all([
      expect(pages[0].locator('.admin-container')).toBeVisible({ timeout: 10000 }),
      expect(pages[1].locator('.board-container')).toBeVisible({ timeout: 10000 }),
      expect(pages[2].locator('.buzzer-container')).toBeVisible({ timeout: 10010 })
    ]);

    const answerButton = pages[0].locator('.answer-btn').first();
    await answerButton.click();
    await pages[0].waitForTimeout(1000);

    expect(await pages[1].locator('.answer-item.revealed').count()).toBeGreaterThan(0);
  });
});

test.describe('Error Handling', () => {
  test('should show error when room not found', async ({ page }) => {
    await page.goto('/game/INVALID/board');

    const errorMessage = page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toContainText('не найдена', { timeout: 5000 });
  });

  test('should handle connection errors gracefully', async ({ page, context }) => {
    await page.goto('/game/TEST/admin');

    await page.context().close();

    const connectionStatus = page.locator('.connection-indicator');
    await expect(connectionStatus).toBeVisible();

    const statusText = connectionStatus.locator('.status-text');
    await expect(statusText).toContainText('Отключено', { timeout: 10000 });
  });

  test('should show help when requested', async ({ page }) => {
    await page.goto('/game/TEST/admin');

    const helpButton = page.locator('button[aria-label*="help"], button:has-text("Справка")');
    await helpButton.click();

    const helpModal = page.locator('[data-testid="help-modal"]');
    await expect(helpModal).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    const createButton = page.locator('button:has-text("Создать игру")');
    await createButton.press('Enter');

    const packSelector = await page.locator('[data-testid="pack-selector"]').isVisible();
    expect(packSelector).toBe(true);
  });

  test('should have proper labels and ARIA attributes', async ({ page }) => {
    await page.goto('/game/TEST/buzzer');

    const teamButtons = page.locator('.team-btn-buzzer');
    const count = await teamButtons.count();

    for (let i = 0; i < count; i++) {
      const button = teamButtons.nth(i);
      await expect(button).toHaveAttribute('data-testid');
    }
  });
});

test.describe('Performance', () => {
  test('should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle rapid changes without lag', async ({ page }) => {
    await page.goto('/game/TEST/admin');

    for (let i = 0; i < 10; i++) {
      const answerButton = page.locator('.answer-btn').nth(i % 6);
      if (await answerButton.isVisible()) {
        await answerButton.click();
      }
    }

    await page.waitForTimeout(500);
    const adminContainer = page.locator('.admin-container');
    await expect(adminContainer).toBeVisible();
  });
});
