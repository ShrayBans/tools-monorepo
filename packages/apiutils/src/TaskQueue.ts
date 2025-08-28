export class TaskQueue {
  private queue: any[] = []

  async add(task: any) {
    this.queue.push(task)
  }

  async process() {
    while (this.queue.length > 0) {
      const task = this.queue.shift()
      await task()
    }
  }

  clear() {
    this.queue = []
  }
}
