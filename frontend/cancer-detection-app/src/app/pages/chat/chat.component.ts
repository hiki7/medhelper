import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { AuthStateService } from '../../auth-state.service';

interface AIResponses {
  [key: string]: string; // Allows for dynamic keys with string values
}

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

  constructor(private authService: AuthService, private router: Router, private authState: AuthStateService) {
  }

  ngOnInit(): void {
    this.authState.loggedIn$.subscribe(loggedIn => {
      this.isLoggedIn = loggedIn;
      if (!this.isLoggedIn) {
        this.router.navigate(['/login']);
      }
    });

    // Check if the user is logged in by safely accessing localStorage
    if (typeof window !== 'undefined') {
      const access: string | null = localStorage.getItem('access');
      this.isLoggedIn = !!access; // Set logged status based on access token
      if (!this.isLoggedIn) {
        this.router.navigate(['/login']);
      }
    }
  }

  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  uploadXray(): void {
    if (this.selectedFile) {
      this.messages.push({text: 'Uploading X-ray...', isUser: true});

      // Simulate a delay for the upload process
      setTimeout(() => {
        this.messages.push({text: 'AI: X-ray uploaded successfully! What would you like to ask?', isUser: false});
        this.showTextarea = true; // Show textarea after upload
        this.scrollToBottom(); // Scroll to the bottom after message
      }, 1000); // Simulated upload time

      (document.getElementById('xray-upload') as HTMLInputElement).value = '';
      this.selectedFile = null; // Clear selected file after upload
    } else {
      this.messages.push({text: 'Please select an X-ray file to upload.', isUser: false});
    }
  }

  sendMessage(): void {
    if (this.userInput.trim()) {
      this.messages.push({text: this.userInput, isUser: true});

      setTimeout(() => {
        const aiResponse = this.getAIResponse(this.userInput);
        this.messages.push({text: aiResponse, isUser: false});
        this.userInput = '';
        this.scrollToBottom();
      }, 500);
    }
  }

  getAIResponse(input: string): string {
    const responses: AIResponses = {
      "What is the diagnosis?": "The X-ray shows signs of possible pneumonia.",
      "Can you explain the results?": "The results indicate some irregularities, please consult a specialist.",
      "What should I do next?": "I recommend scheduling an appointment with a healthcare provider for further evaluation.",
    };

    return responses[input] || "AI: I'm not sure about that. Can you ask something else?";
  }

  scrollToBottom(): void {
    const messageDisplay = document.querySelector('.message-display');
    if (messageDisplay) {
      messageDisplay.scrollTop = messageDisplay.scrollHeight;
    }
  }
}
