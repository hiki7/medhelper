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
  showTextarea: boolean = false;
  chatList: any[] = []; // For storing chat list
  currentChat: any; // To store the selected chat

  constructor(
    private authService: AuthService,
    private router: Router,
    private authState: AuthStateService,
    private chatService: ChatService // Inject the chat service
  ) {}

  ngOnInit(): void {
    this.authState.loggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (!this.isLoggedIn) {
        this.router.navigate(['/login']);
      }
    });

    // Check if the user is logged in by safely accessing localStorage
    if (typeof window !== 'undefined' && window.localStorage) {
      const access: string | null = localStorage.getItem('access');
      this.isLoggedIn = !!access; // Set logged status based on access token
      if (!this.isLoggedIn) {
        this.router.navigate(['/login']);
      }
    }

    // Fetch the chat list when the component initializes
    this.loadChatList();
  }

  loadChatList(): void {
    this.chatService.getChatList().subscribe(
      chats => {
        this.chatList = chats; // Store the fetched chats in chatList
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
    if (this.selectedFile) {
      this.messages.push({ text: 'Uploading X-ray...', isUser: true });

      // Simulate a delay for the upload process
      setTimeout(() => {
        this.messages.push({ text: 'AI: X-ray uploaded successfully! What would you like to ask?', isUser: false });
        this.showTextarea = true; // Show textarea after upload
        this.scrollToBottom(); // Scroll to the bottom after message
      }, 1000); // Simulated upload time

      (document.getElementById('xray-upload') as HTMLInputElement).value = '';
      this.selectedFile = null; // Clear selected file after upload
    } else {
      this.messages.push({ text: 'Please select an X-ray file to upload.', isUser: false });
    }
  }

  sendMessage(): void {
    if (this.userInput.trim()) {
      this.messages.push({ text: this.userInput, isUser: true });

      // Check if there's no current chat; if not, create a new chat
      if (!this.currentChat) {
        this.chatService.createChat().subscribe(chat => {
          this.currentChat = chat; // Set the current chat to the newly created chat
          this.saveMessage(); // Save the user message and get AI response
        });
      } else {
        this.saveMessage(); // Save the user message and get AI response
      }
    }
  }

  private saveMessage(): void {
    this.chatService.sendMessage(this.currentChat.title, this.userInput).subscribe(
      response => {
        const aiResponse = response.result; // Assuming your API returns the AI response
        this.messages.push({ text: aiResponse, isUser: false }); // Add AI response to messages
        this.currentChat.title = aiResponse; // Update the chat title with AI response
        this.userInput = ''; // Clear user input
        this.scrollToBottom(); // Scroll to the bottom
      },
      error => {
        console.error('Error sending message:', error);
      }
    );
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
    this.showTextarea = false; // Hide the textarea until the user uploads an X-ray
    this.loadChatContext(chat.title); // Load the context of the selected chat
  }

  loadChatContext(chatTitle: string): void {
    this.chatService.getChatContext(chatTitle).subscribe(
      response => {
        this.messages = []; // Clear previous messages
        response.context.forEach((msg: any) => {
          // Add user message
          this.messages.push({
            text: msg.content,
            isUser: msg.role === 'user'
          });

          // Add AI response if it exists
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
