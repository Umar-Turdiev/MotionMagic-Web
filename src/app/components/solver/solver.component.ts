import { Component, ElementRef, ViewChild } from '@angular/core';
import { trigger, style, animate, transition } from '@angular/animations';

import { JSONParser } from '@streamparser/json';

import { GeminiService } from 'src/app/services/gemini/gemini.service';
import { EquationService } from 'src/app/services/solver/equation.service';

@Component({
  selector: 'solver',
  templateUrl: './solver.component.html',
  styleUrls: ['./solver.component.css'],
  animations: [
    trigger('inOutAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('2s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        style({ opacity: 1 }),
        animate('2s ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class SolverComponent {
  protected isFileDraggedOver: boolean = false;
  protected images: any[] = [];
  protected textInput: string = '';
  protected aiResponse: string = '';
  protected isSolving: boolean = false;
  protected isResponseComplete: boolean = false;

  @ViewChild('content') contentElement!: ElementRef<HTMLDivElement>;
  @ViewChild('textInput') textInputElement!: ElementRef<HTMLInputElement>;

  prompt = `
  # Physics Problem Solving Pipeline

  You are a physics tutor helping a student solve problems. Your task is to provide a step-by-step solution to the following problem in JSON format. Your response should include the equations, all steps involved, the variables to solve for, and textual explanations. The equations will be processed and calculated after receiving the entire response.
  
  ## Instructions:
  
  1. **Format**: Follow the specified JSON format for your response. Example input and response formats are provided below.
     
  2. **Axis Orientation**: The x-axis points to the right, and the y-axis points upwards. When gravity is involved, define "a_y = -g" in the known variables, instead of using "-g" directly.
  
  3. **Line Breaks**: Do not use line break symbols ("\n") in the response.
  
  4. **Variable Consistency**: 
     - Define every variables before using them.
     - Once a variable is solved, you can use it later.
     - Maintain consistent naming throughout the solution. For example, if you define total height as "h_t", do not switch to "H" later.
     - For initial values, for example "v" initial, the subscript should start with "i", like v_ix, v_iy.
     - For final values, for example "v" final, the subscript should start with "f", like v_fx, v_fy.
  
  5. **Equation Guidelines**:
     - Use multiplication explicitly (e.g., "v_i * sin(θ)").
     - Use SI units by default.
     - For angles, add "°" for degrees and omit for radians.
  
  6. **Explantion Text Guidelines**:
     - Use full LaTex for any math you use inside the explanations, they need to be wrapped in "$".
  
  ## Equations to Follow
  
  You must use these.
  
  [ // 4 kinimatic equations
    "v = v_i + a * t", // Final velocity (v) is equal to initial velocity (v_i) plus acceleration (a) multiplied by time (t)
    "s = v_i * t + (1/2) * a * t^2", // Displacement (s) is equal to initial velocity (v_i) times time (t) plus half of acceleration (a) times time squared (t^2)
    "v^2 = v_i^2 + 2 * a * s", // Final velocity squared (v^2) is equal to initial velocity squared (v_i^2) plus two times acceleration (a) times displacement (s)
    "s = (v + v_i) / 2 * t", // Displacement (s) is the average of initial and final velocities multiplied by time
  ],
  [ // 2D symmatric projectile motion
    "a_x = 0",
    "a_y = -g",
    "t_up = t_down"
    "0 = v_iy + a_y * t_up", // Equation to solve for t_up.
    "v_fy = -v_iy"
    "v_iy = 0 + a_y * t_down", // Equation to solve for t_up.
    "t_t = t_up + t_down", // Total time
    "R = v_x * t_t",
  ],
  [ // 2D asymmatric projectile motion (when h_i ≠ h_f)
    "a_x = 0",
    "a_y = -g",
    "v_fy = 0", // Must define this
    "0 = v_iy + a_y * t_up", // Equation to solve for t_up.
    "h_t = h_i + h_up" // Whenit starts falling, it falls from h_t.
    "0 = h_max + (1/2) * a_y * t_down^2", // Equation to solve for t_down.
    "t_t = t_up + t_down",
    "R = v_x * t_t",
  ],
  [
    "F = m * a", // Newton's second law: Force (F) is equal to mass (m) multiplied by acceleration (a)
  ]
  
  ## Response Format
  {
    "problem": {
      "text": "text_here", // Only the problem text not including the sub-parts.
      "sub_problems": [
        // Leave empty if this problem has no sub-parts.
        // In the sub-part text, don't use any listing bullets (e.g., 1 or a or I); the app will figure it out by its index inside this array.
        "sub-part 1 text",
        "sub-part 2 text"
      ]
    },
    "known": {
      "variable_name1": "value1",
      "variable_name2": "value2"
      // Use variable_name; try to use a single character or a small subscript, e.g., h, v_i, d_f.
      // Use SI units by default and do not add any comments behind each variable. 
      // If the angle value is using degrees, add "°" after it; if it's using radians, don't add anything.
    },
    "steps": [
      {
        "step": 1,
        "task": {
          // Be consistent with variable names; you cannot use previously undefined variable names.
          // After the "solve" has been solved, it will be added to the known set inside my app, so you can use it as well.
          "equation": "equation1",
          "solve": "variable_to_solve1",
          "unit": "unit for variable_to_solve1"
        },
        "explanation": "explanation1"
      },
      {
        "step": 2,
        "task": {
          "equation": "equation2",
          "solve": "variable_to_solve2",
          "unit": "unit for variable_to_solve2"
        },
        "explanation": "explanation2"
      }
      // Add more steps as needed
    ]
  }
  
  ## Bad Example
  "known": {
    "v_i": "300",
    "θ": "60°",
    "h": "80",
    "g": "9.8",
    "a_y": "-g",
    "v_ix": "v_i * cos(θ)",
    "v_iy": "v_i * sin(θ)"
  },
  "steps": [
    {
      "step": 1,
      "task": {
        "equation": "v_y^2 = v_iy^2 + 2 * a_y * y", // "v_y" was never defined before, and it's trying to solve "y"
        "solve": "y", // This is a bad naming here since we're solving for height-related, to make it clean, it should start with an "h_" prefix
      "unit": "m"
      },
      "explanation": "At the maximum height, the vertical velocity is 0. We can use this equation to solve for the vertical distance relative to the building top first."
    }
  ]
  ...
  
  ## Full Example Response
  {
    "problem": {
      "text": "In a game of basketball, a forward makes a bounce pass to the center. The ball is thrown with an initial speed of 5.4 m/s at an angle of 20° below the horizontal. It is released 0.90 m above the floor.",
      "sub_problems": [
        "Calculate the horizontal distance traveled by the ball before bouncing.",
        "Calculate the angle at which it hits the floor."
      ]
    },
    "known": {
      "v": "5.4",
      "θ": "-20°",
      "y": "-0.90",
      "g": "9.8",
      "v_x": "v * cos(θ)",
      "v_y": "v * sin(θ)"
    },
    "steps": [
      {
        "step": 1,
        "task": {
          "equation": "y = v_y * t + 1/2 * g * t^2",
          "solve": "t",
      "unit": "s"
        },
        "explanation": "We can use the equation $y = v_y * t + 1/2 * g * t^2$ to solve for the time $t$ it takes for the ball to hit the floor."
      },
      {
        "step": 2,
        "task": {
          "equation": "x = v_x * t",
          "solve": "x",
      "unit": "m"
        },
        "explanation": "We can use the equation $x = v_x * t$ to solve for the horizontal distance $x$ traveled by the ball before bouncing."
      },
      {
        "step": 3,
        "task": {
          "equation": "v_fy = v_y + g * t",
          "solve": "v_fy",
      "unit": "m/s"
        },
        "explanation": "We can use the equation $v_fy = v_y + g * t$ to get the final vertical velocity $v_fy$ before the ball hits the floor."
      },
      {
        "step": 4,
        "task": {
          "equation": "tan(θ) = v_fy / v_x",
          "solve": "θ",
      "unit": "°"
        },
        "explanation": "We can use the equation $tan(θ) = v_fy / v_x$ to get the angle $θ$ at which the ball hits the floor."
      }
    ]
  }
  `;

  @ViewChild('responseContainer', { static: false })
  responseContainer!: ElementRef;

  constructor(
    private aiService: GeminiService,
    private equationService: EquationService
  ) {}

  ngAfterViewInit() {
    this.textInputAutoResize();
  }

  protected onDragOver(event: DragEvent) {
    this.preventDefault(event);
    this.isFileDraggedOver = true;
  }

  protected onDragLeave(event: DragEvent) {
    this.preventDefault(event);
    this.isFileDraggedOver = false;
  }

  protected onFileDropped(event: DragEvent) {
    this.preventDefault(event);
    this.isFileDraggedOver = false;
    if (event.dataTransfer && event.dataTransfer.files) {
      const files: FileList = event.dataTransfer.files;
      this.handleFiles(files);
    }
  }

  protected preventDefault(event: Event) {
    event.preventDefault();
    event.stopPropagation();
  }

  protected handleFiles(files: FileList) {
    Array.from(files).forEach((file) => {
      if (
        file.type.startsWith('image/png') ||
        file.type.startsWith('image/jpg') ||
        file.type.startsWith('image/jpeg')
      ) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.images.push({ url: e.target.result, file: file });
        };
        reader.readAsDataURL(file);
      }
    });
  }

  protected removeImage(index: number) {
    this.images.splice(index, 1);
  }

  protected onTextInput(event: any) {
    this.textInput = event.target.value;
    this.textInputAutoResize();
  }

  protected textInputAutoResize(): void {
    const textarea = this.textInputElement.nativeElement;
    textarea.style.height = 'auto';

    const scrollHeight = textarea.scrollHeight;
    const maxHeight =
      5 * parseInt(window.getComputedStyle(textarea).lineHeight || '21', 10);

    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }

  protected openFileDialog() {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/png, image/jpg, image/jpeg';
    fileInput.multiple = true;
    fileInput.addEventListener('change', (event: any) => {
      const files = event.target.files;
      this.handleFiles(files);
    });
    fileInput.click();
  }

  protected stopResponse() {
    this.aiService.stop();
  }

  protected clearResponse() {
    this.images = [];
    this.textInputElement.nativeElement.value = '';
    this.aiResponse = '';
    this.isSolving = false;
    this.isResponseComplete = false;
  }

  protected async submit() {
    if (!this.textInput && this.images.length === 0) {
      return;
    }

    this.isSolving = true; // Start loading animation
    this.isResponseComplete = false;

    // Reset everything
    this.aiResponse = '';
    let known: { [key: string]: string } = {};
    let currentStepIndex = 0;
    let currentEquation: string = '';
    let currentVariable: string = '';
    let currentUnit: string = '';

    const files = this.images.map((image) => image.file);

    // this.appendToResponse('$' + '5*9' + '$<br/>');
    // this.appendToResponse('$' + '5/9, 123/3' + '$<br/>');
    // this.appendToResponse('$' + 'v_ix = 9, v_iy = 0' + '$<br/>');
    // this.appendToResponse('$' + 'v = (v_ix^2 + v_fy^2)^(1/2)' + '$<br/>');
    // this.appendToResponse('$' + 'sqrt(v_ix^2 + v_fy^2)' + '$<br/>');

    const parser = new JSONParser();

    // Parse json as it comes
    parser.onValue = ({ key, value, stack }) => {
      if (!value) {
        console.log('Value is undefined or null');
        return;
      }

      // Check if we are in the root
      if (stack.length === 1) {
        switch (key) {
          case 'known':
            if (value && typeof value === 'object' && !Array.isArray(value)) {
              known = value as { [key: string]: string };

              this.appendToResponse('<br/><b>Known values:<b><br/>');
              for (const [key, value] of Object.entries(known)) {
                this.appendToResponse('$' + key + ' = ' + value + '$<br/>');
              }
              this.appendToResponse('<br/><br/>');

              known = this.equationService.preprocessKnowns(known);
              // console.log('Preprocessed Knowns:', known);
            }
            break;

          default:
            break;
        }
      }

      if (stack.length === 2) {
        switch (key) {
          case 'text':
            // Handle the main problem text
            this.appendToResponse(`<br/><b>Question:</b><br/>`);
            this.appendToResponse(value + '<br/><br/>');
            // console.log('Problem text:', value);
            break;

          case 'sub_problems':
            // Handle the list of sub-problems
            let subProblemIndex = 1;
            for (const subProblem of value as string[]) {
              this.appendToResponse(
                `<b>${subProblemIndex}.</b> ${subProblem}<br/>`
              );
              subProblemIndex++;
            }
            break;

          default:
            break;
        }
      }

      if (stack.length === 3) {
        switch (key) {
          case 'step':
            currentStepIndex = value as number;
            currentEquation = '';
            currentVariable = '';
            break;

          case 'explanation':
            // console.log('Explanation:', value);

            this.appendToResponse(`Step ${currentStepIndex}: `);
            this.appendToResponse(`${value}<br/><br/>`);

            let result = this.equationService.solveEquation(
              currentEquation,
              known,
              currentVariable
            );

            if (!result) {
              console.log('Solution not found');
              break;
            }

            this.appendToResponse('$' + currentEquation + '$<br/><br/>');
            this.appendToResponse(
              '$' + result.subsitutedEquation + '$<br/><br/>'
            );
            this.appendToResponse(
              '$' +
                currentVariable +
                ' = ' +
                parseFloat(result.finalAnswer).toFixed(2) +
                '\\ ' +
                currentUnit +
                '$<br/><br/><br/>'
            );
            break;

          default:
            break;
        }
      }

      // Check if we are in the steps array
      if (stack.length === 4) {
        switch (key) {
          case 'equation':
            currentEquation = value as string;
            // console.log('Equation:', value);
            break;

          case 'solve':
            currentVariable = value as string;
            // console.log('Solve:', value);
            break;

          case 'unit':
            currentUnit = value as string;
            // console.log('Unit:', value);
            break;

          default:
            break;
        }
      }
    };

    // Error handling for the parser
    parser.onError = (error) => {
      console.error('Stream parsing error:', error);
    };

    // End of parsing
    parser.onEnd = () => {
      console.log('Stream ended, all data processed.');
    };

    // Stream the json data from the server
    for await (const chunk of this.aiService.generateContentStream(
      this.prompt + this.textInput,
      files
    )) {
      try {
        // Pass each chunk to the json parser
        parser.write(chunk);
      } catch (err) {
        console.log('Error processing chunk:', err);
      }
    }

    parser.end();

    // If the stream wasn't interrupted
    if (this.isSolving) {
      this.isSolving = false; // Stop the loading animation
    }

    this.isResponseComplete = true; // Show the clear button
  }

  private appendToResponse(newContent: string) {
    newContent = this.formatSubscripts(newContent);
    newContent = this.formatSuperscripts(newContent);
    newContent = this.formatTimes(newContent);
    newContent = this.formatFractions(newContent);
    newContent = this.formatSquareRoots(newContent);

    this.aiResponse += newContent;
    this.scrollToBottom(500);
  }

  private formatSubscripts(value: string) {
    return value.replace(/([a-zA-Z])_([a-zA-Z0-9]+)/g, '$1_{$2}');
  }

  private formatSuperscripts(value: string): string {
    // Handle complex exponents that are within parentheses
    value = value.replace(/(\^)\(([^)]+)\)/g, '^{$2}');

    // Handle simple exponents that are just a single number or variable
    value = value.replace(/([a-zA-Z0-9_]+)\^([a-zA-Z0-9.]+)/g, '$1^{$2}');

    return value;
  }

  private formatTimes(value: string) {
    return value.replace(/\*/g, '\\cdot');
  }

  private formatFractions(value: string): string {
    return value.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
  }

  private formatSquareRoots(value: string) {
    return value.replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}');
  }

  private scrollToBottom(duration: number = 250) {
    const startPosition = this.contentElement.nativeElement.scrollTop;
    const endPosition = this.contentElement.nativeElement.scrollHeight;
    const distance = endPosition - startPosition;
    const startTime = performance.now();

    const scrollAnimation = (currentTime: number) => {
      const elapsedTime = currentTime - startTime;
      const scrollAmount = this.easeInOut(
        elapsedTime,
        startPosition,
        distance,
        duration
      );

      this.contentElement.nativeElement.scrollTop = scrollAmount;
      if (elapsedTime < duration) {
        setTimeout(() => {
          requestAnimationFrame(scrollAnimation);
        }, 0);
      }
    };

    requestAnimationFrame(scrollAnimation);
  }

  private easeInOut(t: number, b: number, c: number, d: number) {
    t /= d / 2;
    if (t < 1) return (c / 2) * t * t + b;
    t--;
    return (-c / 2) * (t * (t - 2) - 1) + b;
  }
}
