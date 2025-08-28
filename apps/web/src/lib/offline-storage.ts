import { openDB, DBSchema, IDBPDatabase } from 'idb'

// Define types locally to avoid import issues
interface AiConversation {
  id: string
  title: string
  description?: string | null
  systemPrompt: string
  messageCount: number
  linkedProjectId?: string | null
  linkedTaskId?: string | null
  projectHierarchy?: string | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface AiConversationMessage {
  id: string
  conversationId: string
  content: string
  isUser: boolean
  model?: string | null
  tokenUsage?: string | null
  createdAt: Date
}

interface OfflineDB extends DBSchema {
  conversations: {
    key: string
    value: {
      conversation: AiConversation
      messages: AiConversationMessage[]
      cachedAt: Date
    }
    indexes: {
      'by-updated': Date
      'by-project': string
    }
  }

  personas: {
    key: string
    value: {
      persona: any // Will update when we find persona types
      tools: any[]
      memories: any[]
      cachedAt: Date
    }
    indexes: {
      'by-name': string
    }
  }

  pendingActions: {
    key: string
    value: {
      id: string
      type: 'message' | 'persona-update'
      endpoint: string
      payload: any
      timestamp: Date
      retryCount: number
    }
    indexes: {
      'by-timestamp': Date
    }
  }
}

class OfflineStorage {
  private db: IDBPDatabase<OfflineDB> | null = null
  private readonly DB_NAME = 'shray-offline'
  private readonly DB_VERSION = 1

  async init() {
    if (this.db) return

    this.db = await openDB<OfflineDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Conversations store
        if (!db.objectStoreNames.contains('conversations')) {
          const convStore = db.createObjectStore('conversations', { keyPath: 'conversation.id' })
          convStore.createIndex('by-updated', 'conversation.updatedAt')
          convStore.createIndex('by-project', 'conversation.linkedProjectId')
        }

        // Personas store
        if (!db.objectStoreNames.contains('personas')) {
          const personaStore = db.createObjectStore('personas', { keyPath: 'persona.id' })
          personaStore.createIndex('by-name', 'persona.name')
        }

        // Pending actions store
        if (!db.objectStoreNames.contains('pendingActions')) {
          const actionsStore = db.createObjectStore('pendingActions', { keyPath: 'id' })
          actionsStore.createIndex('by-timestamp', 'timestamp')
        }
      }
    })
  }

  async cacheConversation(conversation: AiConversation, messages: AiConversationMessage[]) {
    if (!this.db) await this.init()

    await this.db!.put('conversations', {
      conversation,
      messages,
      cachedAt: new Date()
    })
  }

  async getCachedConversations(limit = 20): Promise<Array<{conversation: AiConversation, messages: AiConversationMessage[]}>> {
    if (!this.db) await this.init()

    const tx = this.db!.transaction('conversations', 'readonly')
    const index = tx.store.index('by-updated')
    const items = await index.getAll(null, limit)

    return items.map(item => ({
      conversation: item.conversation,
      messages: item.messages
    }))
  }

  async cachePersona(persona: any, tools: any[], memories: any[]) {
    if (!this.db) await this.init()

    await this.db!.put('personas', {
      persona,
      tools,
      memories,
      cachedAt: new Date()
    })
  }

  async getCachedPersonas(): Promise<Array<{persona: any, tools: any[], memories: any[]}>> {
    if (!this.db) await this.init()

    const items = await this.db!.getAll('personas')

    return items.map(item => ({
      persona: item.persona,
      tools: item.tools,
      memories: item.memories
    }))
  }

  async queueAction(action: Omit<OfflineDB['pendingActions']['value'], 'id'>) {
    if (!this.db) await this.init()

    const id = `action-${Date.now()}-${Math.random()}`
    await this.db!.add('pendingActions', { ...action, id })
  }

  async getPendingActions() {
    if (!this.db) await this.init()

    return this.db!.getAll('pendingActions')
  }

  async clearPendingAction(id: string) {
    if (!this.db) await this.init()

    await this.db!.delete('pendingActions', id)
  }
}

export const offlineStorage = new OfflineStorage()