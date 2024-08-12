import { Component } from '@angular/core';

import { SimulationControlSharedService } from 'src/app/services/simulation-control-shared.service';

@Component({
  selector: 'play-pause-control',
  templateUrl: './play-pause-control.component.html',
  styleUrls: ['./play-pause-control.component.css', '../../../styles.css'],
})
export class PlayPauseControlComponent {
  constructor(
    private simulationControlSharedService: SimulationControlSharedService,
  ) {}

  isPlaying: boolean = false;

  togglePlayPause(): void {
    this.isPlaying = !this.isPlaying;
    this.simulationControlSharedService.setIsRunning(this.isPlaying);
  }

  reset(): void {
    this.isPlaying = false; // Assuming you want to start after a restart
    this.simulationControlSharedService.setIsRunning(this.isPlaying);
    this.simulationControlSharedService.sendRestartSignal();
  }
}
