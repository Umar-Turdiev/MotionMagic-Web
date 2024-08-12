import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';

import { MathjaxModule } from 'mathjax-angular';

import { SimulatorRoutingModule } from './simulator-routing.module';
import { SimulatorComponent } from './simulator.component';

/* Other UI Components */
import { ViewportComponent } from 'src/app/components/viewport/viewport.component';
import { MenuBarComponent } from 'src/app/components/menu-bar/menu-bar.component';
import { EditToolbarComponent } from 'src/app/components/edit-toolbar/edit-toolbar.component';
import { PencilBarComponent } from 'src/app/components/pencil-bar/pencil-bar.component';
import { SceneExplorerPanelComponent } from 'src/app/components/panel/scene-explorer-panel.component';
import { PropertiesPanelComponent } from 'src/app/components/panel/properties-panel.component';
import { PlayPauseControlComponent } from 'src/app/components/play-pause-control/play-pause-control.component';
import { PenComponent } from 'src/app/components/pencil-bar/pen-tools/pen.component';
import { BasePanelComponent } from 'src/app/components/panel/base-panel.component';
import { DropdownComponent } from 'src/app/components/dropdown/dropdown.component';
import { TextboxUpDownComponent } from 'src/app/components/textbox-up-down/textbox-up-down.component';
import { ToggleSwitchComponent } from 'src/app/components/toggle/toggle-switch.component';
import { EditableLabelComponent } from 'src/app/components/editable-label/editable-label.component';
import { ColorPickerComponent } from 'src/app/components/color-picker/color-picker.component';
import { UnderlineTextboxComponent } from 'src/app/components/underline-textbox/underline-textbox.component';
import { UnderlineDropdownComponent } from 'src/app/components/underline-dropdown/underline-dropdown.component';
import { PenSettingsMenu } from 'src/app/components/pencil-bar/pen-settings-menu/pen-settings-menu.component';
import { SceneParserService } from 'src/app/services/scene-parser.service';
import { SolverComponent } from 'src/app/components/solver/solver.component';

@NgModule({
  declarations: [
    SimulatorComponent,
    ViewportComponent,
    MenuBarComponent,
    EditToolbarComponent,
    PencilBarComponent,
    SceneExplorerPanelComponent,
    PropertiesPanelComponent,
    PlayPauseControlComponent,
    PenComponent,
    BasePanelComponent,
    DropdownComponent,
    TextboxUpDownComponent,
    ToggleSwitchComponent,
    EditableLabelComponent,
    ColorPickerComponent,
    UnderlineTextboxComponent,
    UnderlineDropdownComponent,
    PenSettingsMenu,
    SolverComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MathjaxModule.forRoot({
      config: {
        loader: {
          load: ['output/svg', '[tex]/require', '[tex]/ams'],
        },
        tex: {
          inlineMath: [['$', '$']],
          packages: ['base', 'require', 'ams'],
        },
        svg: { fontCache: 'global' },
      },
      src: 'https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/startup.js',
    }),
    SimulatorRoutingModule,
  ],
  providers: [SceneParserService],
})
export class SimulatorModule {}
