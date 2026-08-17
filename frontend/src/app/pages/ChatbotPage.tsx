import React from 'react';
import Chatbot from '../components/Chatbot';

const ChatbotPage: React.FC = () => {
  return (
    <div className="flex-1 w-full h-full flex justify-center items-center">
      <Chatbot />
    </div>
  );
};

export default ChatbotPage;