import React, { useState, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator
} from 'react-native';

const GEMINI_API_KEY = 'API'; 

export default function App() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // 這是我們的「記憶中樞」，負責儲存所有的對話歷史
  const [messages, setMessages] = useState([
    { id: '0', role: 'model', text: '你好！我是你的專屬 AI 助手，有什麼我可以幫忙的嗎？' }
  ]);

  const flatListRef = useRef(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // 1. 將使用者的輸入加入聊天畫面
    const userMessage = { 
      id: Date.now().toString(), 
      role: 'user', 
      text: inputText 
    };
    
    // 更新本地 state 陣列，準備好最新的歷史紀錄
    const newChatHistory = [...messages, userMessage];
    setMessages(newChatHistory);
    setInputText('');
    setIsLoading(true);

    try {
      // 2. 核心邏輯：將所有的歷史訊息轉換成 Gemini API 規定的格式
      // 注意：Gemini API 的角色只能是 'user' 或 'model'
      const apiContents = newChatHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // 3. 呼叫雲端 LLM API (帶入完整的對話陣列)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${GEMINI_API_KEY}`, 
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: apiContents })
        }
      );

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // 4. 解析回傳結果並顯示在畫面上
      const botReplyText = data.candidates[0].content.parts[0].text;
      const botMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: botReplyText
      };

      setMessages(prev => [...prev, botMessage]);

    } catch (error) {
      console.error('API 請求失敗:', error);
      alert('發生錯誤，請檢查 API Key 或網路連線狀態。');
    } finally {
      setIsLoading(false);
    }
  };

  // 渲染單一對話泡泡的 UI
  const renderMessageItem = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.modelBubble]}>
        <Text style={[styles.messageText, isUser ? styles.userText : styles.modelText]}>
          {item.text}
        </Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>雲端 LLM 聊天室</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.chatContainer}
        // 當有新訊息時自動捲動到最底部
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="輸入訊息..."
          value={inputText}
          onChangeText={setInputText}
          editable={!isLoading}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!inputText.trim() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendButtonText}>發送</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chatContainer: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  userBubble: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  modelBubble: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  modelText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: 30, // 給手機底部的安全距離
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0CFFF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
