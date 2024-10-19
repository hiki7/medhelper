import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { AuthStateService } from '../../auth-state.service';
import { ChatService } from '../../chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {
  isLoggedIn: boolean = false;
  messages: { text: string; isUser: boolean }[] = [];
  userInput: string = '';
  selectedFile: File | null = null;
  showTextarea: boolean = true; // Ensure textarea is shown by default
  chatList: any[] = []; // For storing chat list
  currentChat: any; // To store the selected chat

  constructor(
    private authService: AuthService,
    private router: Router,
    private authState: AuthStateService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    this.authState.loggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (!this.isLoggedIn) {
        this.router.navigate(['/login']);
      }
    });

    if (typeof window !== 'undefined' && window.localStorage) {
      const access: string | null = localStorage.getItem('access');
      this.isLoggedIn = !!access; // Set logged status based on access token
      if (!this.isLoggedIn) {
        this.router.navigate(['/login']);
      }
    }

    this.loadChatList();
    this.createNewChat(); // Automatically create a new chat on initialization
  }

  loadChatList(): void {
    this.chatService.getChatList().subscribe(
      chats => {
        this.chatList = chats; // Store the fetched chats
      },
      error => {
        console.error('Error loading chat list:', error);
      }
    );
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  uploadXray(): void {
    const formData = new FormData();
    formData.append('description', this.userInput);
    formData.append('chat_title', this.currentChat.title); // Include chat title
    if (this.selectedFile) {
      formData.append('image', this.selectedFile); // Include the image file
    }

    this.chatService.uploadImageOrText(formData).subscribe(
      response => {
        this.messages.push({ text: 'AI: X-ray uploaded successfully! What would you like to ask?', isUser: false });
        this.scrollToBottom();
        this.showTextarea = true; // Show textarea after upload
      },
      error => {
        console.error('Error uploading X-ray:', error);
        this.messages.push({ text: 'Failed to upload X-ray. Please try again.', isUser: false });
      }
    );

    (document.getElementById('xray-upload') as HTMLInputElement).value = '';
    this.selectedFile = null; // Clear selected file after upload
  }

  createNewChat(): void {
    this.currentChat = { title: 'New Chat' }; // Temporary chat
    this.messages = []; // Clear messages for the new chat
    this.showTextarea = true; // Show the textarea for user input
  }

  sendMessage(): void {
    if (this.userInput.trim()) {
      this.messages.push({ text: this.userInput, isUser: true });

      if (!this.currentChat) {
        this.createNewChat();
      }

      this.chatService.sendMessage(this.currentChat.title, this.userInput).subscribe(
        response => {
          const aiResponse = response.result; // Assuming your API returns the AI response
          this.messages.push({ text: aiResponse, isUser: false }); // Add AI response
          this.currentChat.title = aiResponse; // Update chat title with AI response
          this.userInput = ''; // Clear user input
          this.scrollToBottom(); // Scroll to the bottom
        },
        error => {
          console.error('Error sending message:', error);
        }
      );
    }
  }

  scrollToBottom(): void {
    const messageDisplay = document.querySelector('.message-display');
    if (messageDisplay) {
      messageDisplay.scrollTop = messageDisplay.scrollHeight;
    }
  }

  selectChat(chat: any): void {
    this.currentChat = chat; // Set the current chat to the selected chat
    this.messages = []; // Clear messages for the new chat
    this.showTextarea = true; // Show the textarea
    this.loadChatContext(chat.title); // Load the context of the selected chat
  }

  loadChatContext(chatTitle: string): void {
    this.chatService.getChatContext(chatTitle).subscribe(
      response => {
        this.messages = []; // Clear previous messages
        response.context.forEach((msg: any) => {
          this.messages.push({
            text: msg.content,
            isUser: msg.role === 'user'
          });

          if (msg.response) {
            this.messages.push({
              text: msg.response,
              isUser: false // AI messages are from the assistant
            });
          }
        });
        this.showTextarea = true; // Show the textarea if there are messages
        this.scrollToBottom(); // Scroll to the bottom after loading messages
      },
      error => {
        console.error('Error loading chat context:', error);
      }
    );
  }
}
