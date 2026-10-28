import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const storageKey = 'taskflow:v1'
const recoveryKey = 'taskflow:recovery'

async function openCleanApp(page) {
  await page.goto('/')
  await page.evaluate(
    ([primary, recovery]) => {
      localStorage.removeItem(primary)
      localStorage.removeItem(recovery)
    },
    [storageKey, recoveryKey],
  )
  await page.reload()
}

async function navigate(page, name) {
  await page.getByRole('complementary').getByRole('button', { name }).click()
}

async function createTask(page, title, options = {}) {
  await page.getByRole('button', { name: 'New task', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'New task' })
  await dialog.getByLabel('Task title').fill(title)
  if (options.estimatedMinutes)
    await dialog
      .getByLabel('Estimated minutes')
      .fill(String(options.estimatedMinutes))
  await dialog.getByRole('button', { name: 'Create task' }).click()
  await expect(dialog).toBeHidden()
}

function taskCard(page, title) {
  return page.locator('article.task-card').filter({ hasText: title })
}

test.beforeEach(async ({ page }) => {
  await openCleanApp(page)
})

test('creates and completes a task and persists both states after refresh', async ({
  page,
}) => {
  const title = 'Persist the launch checklist'
  await createTask(page, title)
  await navigate(page, 'All tasks')
  await expect(taskCard(page, title)).toBeVisible()

  await page.reload()
  await navigate(page, 'All tasks')
  await expect(taskCard(page, title)).toBeVisible()
  await page.getByRole('checkbox', { name: `Complete ${title}` }).click()

  await page.reload()
  await navigate(page, 'Completed')
  await expect(taskCard(page, title)).toBeVisible()
  await expect(
    page.getByRole('checkbox', { name: `Mark incomplete ${title}` }),
  ).toHaveAttribute('aria-checked', 'true')
})

test('moves a task through Kanban and synchronizes completion views', async ({
  page,
}) => {
  const title = 'Ship Kanban workflow'
  await createTask(page, title)
  await navigate(page, 'Kanban board')

  const todoColumn = page.locator('section.kanban-column').filter({
    has: page.getByRole('heading', { name: 'To Do', exact: true }),
  })
  await todoColumn
    .locator('article.kanban-card')
    .filter({ hasText: title })
    .getByRole('button', { name: 'Move to In Progress' })
    .click()

  const progressColumn = page.locator('section.kanban-column').filter({
    has: page.getByRole('heading', { name: 'In Progress', exact: true }),
  })
  const progressCard = progressColumn
    .locator('article.kanban-card')
    .filter({ hasText: title })
  await expect(progressCard).toBeVisible()
  await progressCard.getByRole('button', { name: 'Move to Done' }).click()

  const doneColumn = page.locator('section.kanban-column').filter({
    has: page.getByRole('heading', { name: 'Done', exact: true }),
  })
  await expect(
    doneColumn.locator('article.kanban-card').filter({ hasText: title }),
  ).toBeVisible()
  await page.reload()
  await navigate(page, 'Kanban board')
  await expect(
    page
      .locator('section.kanban-column')
      .filter({ has: page.getByRole('heading', { name: 'Done', exact: true }) })
      .locator('article.kanban-card')
      .filter({ hasText: title }),
  ).toBeVisible()
  await navigate(page, 'Completed')
  await expect(taskCard(page, title)).toBeVisible()
})

test('recovers a running Pomodoro from its persisted deadline after refresh', async ({
  page,
}) => {
  await navigate(page, 'Focus mode')
  await page.getByLabel('Focus', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Start focus' }).click()
  const before = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key))
    return state.activeFocusSession
  }, storageKey)
  expect(before.status).toBe('running')

  await page.reload()
  await navigate(page, 'Focus mode')
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  const after = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key))
    return state.activeFocusSession
  }, storageKey)
  expect(after.id).toBe(before.id)
  expect(after.endsAt).toBe(before.endsAt)

  await expect
    .poll(async () => {
      const displayed = await page.locator('.focus-clock strong').textContent()
      const [minutes, seconds] = displayed.split(':').map(Number)
      const expectedSeconds = Math.max(
        0,
        Math.floor((Date.parse(after.endsAt) - Date.now()) / 1000),
      )
      return Math.abs(minutes * 60 + seconds - expectedSeconds)
    })
    .toBeLessThanOrEqual(2)
})

test('persists a completed habit after refresh', async ({ page }) => {
  const title = 'Review reliability notes'
  await navigate(page, 'Habit tracker')
  await page.getByRole('button', { name: 'New habit' }).click()
  const dialog = page.getByRole('dialog', { name: 'New habit' })
  await dialog.getByLabel('Habit name').fill(title)
  await dialog.getByRole('button', { name: 'Save habit' }).click()
  await page
    .getByRole('button', { name: new RegExp(`^Complete ${title}`) })
    .click()

  await page.reload()
  await navigate(page, 'Habit tracker')
  await expect(
    page.getByRole('button', { name: new RegExp(`^Undo ${title}`) }),
  ).toBeVisible()
  await expect(
    page.getByRole('heading', { name: '1 of 1 habits complete' }),
  ).toBeVisible()
})

test('saves a daily plan within its budget and restores it after refresh', async ({
  page,
}) => {
  const title = 'Plan release verification'
  await createTask(page, title, { estimatedMinutes: 30 })
  await navigate(page, 'Daily planner')
  await page.getByLabel('Available focus time').fill('60')
  await page.getByRole('button', { name: 'Plan my day' }).click()
  await expect(
    page.locator('article.planned-task').filter({ hasText: title }),
  ).toBeVisible()
  await expect(
    page.locator('.plan-summary').getByText('30', { exact: true }),
  ).toHaveCount(2)
  await page.getByRole('button', { name: 'Save plan' }).click()
  await expect
    .poll(async () =>
      page.evaluate((key) => {
        const state = JSON.parse(localStorage.getItem(key))
        return state.dailyPlans.length
      }, storageKey),
    )
    .toBe(1)

  await page.reload()
  await navigate(page, 'Daily planner')
  await expect(page.getByRole('status')).toContainText('Saved plan loaded')
  await expect(
    page.locator('article.planned-task').filter({ hasText: title }),
  ).toBeVisible()
})

test('exports a backup and restores it through the import flow', async ({
  page,
}) => {
  const exportedTitle = 'Keep exported task'
  const temporaryTitle = 'Remove temporary task'
  await createTask(page, exportedTitle)
  await navigate(page, 'Data management')
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download = await downloadPromise
  const backupPath = await download.path()
  expect(backupPath).toBeTruthy()
  const backup = JSON.parse(await readFile(backupPath, 'utf8'))
  expect(backup.version).toBe(2)
  expect(backup.tasks.some((task) => task.title === exportedTitle)).toBe(true)

  await createTask(page, temporaryTitle)
  await navigate(page, 'Data management')
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByLabel('TaskFlow backup file').setInputFiles(backupPath)
  await expect(page.getByRole('status')).toContainText(
    'Backup restored successfully',
  )
  await navigate(page, 'All tasks')
  await expect(taskCard(page, exportedTitle)).toBeVisible()
  await expect(taskCard(page, temporaryTitle)).toHaveCount(0)
})

test('rejects an invalid backup without replacing existing data', async ({
  page,
}) => {
  const title = 'Protect current workspace'
  await createTask(page, title)
  await navigate(page, 'Data management')
  await page.getByLabel('TaskFlow backup file').setInputFiles({
    name: 'invalid-taskflow.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not valid JSON'),
  })
  await expect(page.getByRole('status')).toContainText(
    'Choose a valid TaskFlow backup file',
  )
  await navigate(page, 'All tasks')
  await expect(taskCard(page, title)).toBeVisible()
  const storedTitles = await page.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key))
    return state.tasks.map((task) => task.title)
  }, storageKey)
  expect(storedTitles).toContain(title)
})
