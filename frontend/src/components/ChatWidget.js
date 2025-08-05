import React, { useState, useEffect, useRef } from 'react';
import { 
  Button, Input, List, Avatar, Card, Upload, message 
} from 'antd';
import { 
  SendOutlined, PaperClipOutlined, CloseOutlined 
} from '@ant-design/icons';
import api from '../utils/api';
import wsClient from '../utils/wsClient';

const { TextArea } = Input;

const ChatWidget = ({ clientId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (clientId) {
      fetchMessages();
      setupWebSocket();
    }
    
    return () => {
      wsClient.disconnect();
    };
  }, [clientId]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/chat/history/${clientId}`);
      setMessages(response.data.reverse());
      scrollToBottom();
    } catch (error) {
      message.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const setupWebSocket = () => {
    wsClient.connect(localStorage.getItem('authToken'));
    
    wsClient.on('new_message', (message) => {
      if (message.client_id === clientId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && fileList.length === 0) return;
    
    try {
      const formData = new FormData();
      formData.append('client_id', clientId);
      formData.append('message', newMessage);
      formData.append('channel', 'app');
      
      fileList.forEach(file => {
        formData.append('attachments', file.originFileObj);
      });
      
      await api.post('/api/chat/send', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setNewMessage('');
      setFileList([]);
    } catch (error) {
      message.error('Failed to send message');
    }
  };

  const beforeUpload = (file) => {
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must smaller than 5MB!');
    }
    return isLt5M;
  };

  return (
    <Card
      title={`Chat with Client #${clientId}`}
      extra={<Button icon={<CloseOutlined />} onClick={onClose} />}
      style={{ width: 400, position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}
    >
      <div style={{ height: 300, overflowY: 'auto', marginBottom: 16 }}>
        <List
          loading={loading}
          dataSource={messages}
          renderItem={item => (
            <List.Item
              style={{ 
                justifyContent: item.direction === 'out' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '80%',
                  background: item.direction === 'out' ? '#e6f7ff' : '#f9f9f9',
                  padding: 8,
                  borderRadius: 8
                }}
              >
                <div>{item.message}</div>
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>
                  {new Date(item.created_at).toLocaleTimeString()}
                </div>
              </div>
            </List.Item>
          )}
        />
        <div ref={messagesEndRef} />
      </div>
      
      <div>
        <Upload
          fileList={fileList}
          beforeUpload={beforeUpload}
          onChange={({ fileList }) => setFileList(fileList)}
          multiple={false}
          showUploadList={false}
        >
          <Button icon={<PaperClipOutlined />} />
        </Upload>
        
        <TextArea
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={e => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          style={{ margin: '0 8px' }}
        />
        
        <Button 
          type="primary" 
          icon={<SendOutlined />} 
          onClick={handleSendMessage}
        />
      </div>
    </Card>
  );
};

export default ChatWidget;