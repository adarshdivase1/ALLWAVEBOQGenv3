

import type { QuestionnaireSection } from '../types';

export const questionnaire: QuestionnaireSection[] = [
  {
    title: '1. Room Fundamentals',
    questions: [
      {
        id: 'roomType',
        text: 'What is the primary function of this room?',
        type: 'select',
        options: [
          { label: 'Conference Room', value: 'conference' },
          { label: 'Huddle Room', value: 'huddle' },
          { label: 'Boardroom', value: 'boardroom' },
          { label: 'Classroom / Training Room', value: 'classroom' },
          { label: 'Auditorium', value: 'auditorium' },
          { label: 'Town Hall / All-Hands Space', value: 'town_hall' },
          { label: 'Experience Center', value: 'experience_center' },
          { label: 'NOC / Command Center', value: 'noc' },
          { label: 'Executive Office', value: 'executive_office' },
          { label: 'Lobby / Digital Signage', value: 'lobby' },
        ],
      },
      { id: 'roomLength', text: 'Room Length (in feet)', type: 'number' },
      { id: 'roomWidth', text: 'Room Breadth/Width (in feet)', type: 'number' },
      { id: 'roomHeight', text: 'Room Height (in feet)', type: 'number' },
      { id: 'capacity', text: 'How many people will the room typically accommodate?', type: 'number' },
      {
        id: 'tableShape',
        text: 'What is the shape of the primary table/seating arrangement?',
        type: 'select',
        options: [
          { label: 'Long Boardroom/Rectangle Table', value: 'boardroom_long' },
          { label: 'U-Shape', value: 'u_shape' },
          { label: 'Classroom Style (Rows)', value: 'classroom_rows' },
          { label: 'Round/Square Table', value: 'round_square' },
          { label: 'No Table / Open Space', value: 'open_space' },
        ],
      },
      {
        id: 'aesthetics',
        text: 'What is the aesthetic requirement for the equipment?',
        type: 'select',
        options: [
            { label: 'Standard (Visible equipment is acceptable)', value: 'standard' },
            { label: 'Architecturally Integrated (Hide equipment where possible)', value: 'integrated' },
        ],
      },
    ],
  },
  {
    title: '2. Display System',
    questions: [
      {
        id: 'displayType',
        text: 'What kind of main display is needed?',
        type: 'select',
        options: [
          { label: 'Single Large Format Display (LFD)', value: 'single_lfd' },
          { label: 'Dual Large Format Displays (LFDs)', value: 'dual_lfd' },
          { label: 'Video Wall', value: 'video_wall' },
          { label: 'Projector and Screen', value: 'projector' },
        ],
      },
      {
        id: 'displayBrands',
        text: 'Are there any preferred display brands?',
        type: 'multiple-choice',
        options: [
          { label: 'Samsung', value: 'Samsung' },
          { label: 'LG', value: 'LG' },
          { label: 'Sony', value: 'Sony' },
          { label: 'BenQ', value: 'BenQ' },
          { label: 'ViewSonic', value: 'ViewSonic' },
          { label: 'Sharp', value: 'Sharp' },
          { label: 'Newline', value: 'Newline' },
          { label: 'NEC', value: 'NEC' },
          { label: 'Dell', value: 'Dell' },
          { label: 'DTEN', value: 'DTEN' },
          { label: 'AVOCOR', value: 'AVOCOR' },
          { label: 'Epson (Projectors)', value: 'Epson' },
          { label: 'Christie (Projectors)', value: 'Christie' },
          { label: 'Absen (Video Walls)', value: 'Absen' },
        ],
      },
       {
        id: 'interactiveDisplay',
        text: 'Is an interactive/touch display required for collaboration?',
        type: 'select',
        options: [
          { label: 'Yes, interactive capability is essential', value: 'yes' },
          { label: 'No, a standard non-touch display is sufficient', value: 'no' },
        ],
      },
    ],
  },
  {
    title: '3. Video Conferencing',
    questions: [
      {
        id: 'conferencing',
        text: 'Will video conferencing be used in this room?',
        type: 'select',
        options: [
          { label: 'Yes, this is a primary function', value: 'primary_vc' },
          { label: 'Yes, but for occasional use', value: 'occasional_vc' },
          { label: 'No, this room is for local presentation only', value: 'no_vc' },
        ],
      },
      {
        id: 'vcArchitecture',
        text: 'What is the preferred system architecture?',
        type: 'select',
        options: [
          { label: 'All-in-One Solution (e.g., Video Bar with integrated camera, mics, speakers)', value: 'all_in_one' },
          { label: 'Component-Based System (Separate camera, mics, DSP, etc. for best performance)', value: 'component_based' },
        ],
      },
      {
        id: 'vcPlatform',
        text: 'What video conferencing platforms will be used?',
        type: 'multiple-choice',
        options: [
          { label: 'Bring Your Own Device (BYOD) - Users connect laptops', value: 'byod' },
          { label: 'Dedicated Room System (e.g., Microsoft Teams Room, Zoom Room)', value: 'dedicated_room_system' },
        ],
      },
      {
        id: 'vcBrands',
        text: 'Any preferred video conferencing system brands?',
        type: 'multiple-choice',
        options: [
            { label: 'Yealink', value: 'Yealink' },
            { label: 'Poly', value: 'Poly' },
            { label: 'Logitech', value: 'Logitech' },
            { label: 'Cisco', value: 'Cisco' },
            { label: 'Neat', value: 'Neat' },
            { label: 'Jabra', value: 'Jabra' },
            { label: 'MAXHUB', value: 'MAXHUB' },
            { label: 'Huddly', value: 'Huddly' },
            { label: 'DTEN', value: 'DTEN' },
            { label: 'Peoplelink', value: 'Peoplelink' },
            { label: 'Microsoft (Teams)', value: 'Microsoft' },
        ]
      },
      {
        id: 'cameraNeeds',
        text: 'What are the camera requirements for video conferencing?',
        type: 'select',
        options: [
          { label: 'Standard PTZ (Pan-Tilt-Zoom) camera', value: 'ptz_standard' },
          { label: 'Auto-framing / Speaker Tracking Camera', value: 'speaker_tracking' },
          { label: 'Multiple cameras for different views', value: 'multi_camera' },
          { label: 'No camera needed', value: 'no_camera' },
        ],
      },
    ],
  },
  {
    title: '4. Audio System',
    questions: [
      {
        id: 'microphoneType',
        text: 'What type of microphones are preferred for participants?',
        type: 'multiple-choice',
        options: [
          { label: 'Ceiling microphones (for a clean table)', value: 'ceiling_mics' },
          { label: 'Tabletop microphones (wired or wireless)', value: 'table_mics' },
          { label: 'Microphone integrated into a soundbar/video bar', value: 'bar_mics' },
          { label: 'No microphones needed', value: 'no_mics' },
        ],
      },
      {
        id: 'presenterMicrophone',
        text: 'Does a presenter need a dedicated microphone?',
        type: 'multiple-choice',
        options: [
          { label: 'Yes, a wireless handheld microphone', value: 'wireless_handheld' },
          { label: 'Yes, a wireless lavalier/lapel microphone', value: 'wireless_lavalier' },
          { label: 'Yes, a microphone at a lectern', value: 'lectern_mic' },
          { label: 'No dedicated presenter mic needed', value: 'no_presenter_mic' },
        ],
      },
      {
        id: 'audioPlayback',
        text: 'What are the audio playback requirements?',
        type: 'select',
        options: [
          { label: 'Voice reinforcement only (for calls and speech)', value: 'voice_only' },
          { label: 'High-quality program audio (for videos, music)', value: 'program_audio' },
        ],
      },
      {
        id: 'speakerType',
        text: 'What type of speakers are preferred for the room?',
        type: 'multiple-choice',
        options: [
          { label: 'In-Ceiling Speakers (discreet, even coverage)', value: 'ceiling_speakers' },
          { label: 'Surface-Mount / On-Wall Speakers', value: 'wall_speakers' },
          { label: 'Soundbar (mounted with display)', value: 'soundbar' },
          { label: 'Pendant Speakers (for high/open ceilings)', value: 'pendant_speakers' },
          { label: 'Floor-Standing / Bookshelf Speakers (high-fidelity)', value: 'floor_speakers' },
          { label: 'Integrated in Video Bar', value: 'bar_integrated_speakers' },
        ],
      },
      {
        id: 'speakerCoverage',
        text: 'What is the desired audio coverage pattern?',
        type: 'select',
        options: [
          { label: 'Distributed (even coverage for all participants)', value: 'distributed' },
          { label: 'Front of Room (focused near the display)', value: 'front_focused' },
          { label: 'Stereo Left/Right of Display', value: 'stereo' },
          { label: 'Zoned Audio (different audio in different areas)', value: 'zoned' },
        ]
      },
      {
        id: 'audioBrands',
        text: 'Any preferred audio brands (mics, speakers, DSPs)?',
        type: 'multiple-choice',
        options: [
            { label: 'Shure', value: 'Shure' },
            { label: 'Biamp', value: 'Biamp' },
            { label: 'QSC', value: 'QSC' },
            { label: 'Sennheiser', value: 'Sennheiser' },
            { label: 'JBL', value: 'JBL' },
            { label: 'Audio-Technica', value: 'Audio-Technica' },
            { label: 'Yamaha', value: 'Yamaha' },
            { label: 'Fohhn', value: 'Fohhn' },
            { label: 'BSS', value: 'BSS' },
            { label: 'Clearcom', value: 'Clearcom' },
            { label: 'Dali', value: 'Dali' },
            { label: 'Studio Master', value: 'Studio Master' },
            { label: 'Logic', value: 'Logic' },
            { label: 'Gigatronics', value: 'Gigatronics' },
        ]
      },
    ],
  },
  {
    title: '5. Connectivity & Control',
    questions: [
      {
        id: 'connectivity',
        text: 'How will users connect their devices to present?',
        type: 'multiple-choice',
        options: [
          { label: 'Wireless Presentation (e.g., Barco ClickShare, Crestron AirMedia)', value: 'wireless' },
          { label: 'Wired HDMI at the table', value: 'hdmi_table' },
          { label: 'Wired USB-C at the table (video & power)', value: 'usbc_table' },
          { label: 'Wired connections at a wall plate', value: 'wall_plate_connections' },
        ],
      },
      {
        id: 'matrixSwitcherRequired',
        text: 'Is a dedicated matrix switcher required for complex routing (e.g., multiple sources to multiple displays)?',
        type: 'select',
        options: [
          { label: 'Yes, a matrix switcher is necessary', value: 'yes' },
          { label: 'No, simple source selection is sufficient', value: 'no' },
        ],
      },
      {
        id: 'cableCubbyPorts',
        text: 'Which ports are required in the tabletop cable cubby/box?',
        type: 'multiple-choice',
        options: [
            { label: 'HDMI Input', value: 'hdmi_input' },
            { label: 'USB-C (with video & power delivery)', value: 'usbc_video_power' },
            { label: 'USB-A (for peripherals)', value: 'usba_peripheral' },
            { label: 'DisplayPort Input', value: 'displayport_input' },
            { label: 'RJ-45 Network Jack', value: 'network_jack' },
            { label: 'AC Power Outlet', value: 'ac_power' },
        ],
      },
      {
        id: 'connectivityBrands',
        text: 'Any preferred connectivity or infrastructure brands?',
        type: 'multiple-choice',
        options: [
          { label: 'Lightware', value: 'Lightware' },
          { label: 'Kramer', value: 'Kramer' },
          { label: 'ATEN', value: 'ATEN' },
          { label: 'Barco (ClickShare)', value: 'Barco' },
          { label: 'Airtame', value: 'Airtame' },
          { label: 'Apple (AirPlay)', value: 'Apple' },
          { label: 'Inogeni', value: 'Inogeni' },
          { label: 'Magewell', value: 'Magewell' },
          { label: 'Atlona', value: 'Atlona' },
          { label: 'C2G', value: 'C2G' },
          { label: 'BlackBox', value: 'BlackBox' },
          { label: 'Belden', value: 'Belden' },
          { label: 'Panduit', value: 'Panduit' },
          { label: 'Liberty', value: 'Liberty' },
          { label: 'Brightsign', value: 'Brightsign' },
          { label: 'Gigatronics', value: 'Gigatronics' },
        ]
      },
      {
        id: 'controlSystem',
        text: 'How should the room AV system be controlled?',
        type: 'select',
        options: [
          { label: 'Simple remote or auto-source switching', value: 'remote' },
          { label: 'Wall-mounted keypad for basic functions', value: 'keypad' },
          { label: 'Tabletop touch panel for full control', value: 'touch_panel' },
          { label: 'No centralized control needed', value: 'none' },
        ],
      },
      {
        id: 'controlBrands',
        text: 'Any preferred control system brands?',
        type: 'multiple-choice',
        options: [
            { label: 'Crestron', value: 'Crestron' },
            { label: 'Extron', value: 'Extron' },
            { label: 'AMX', value: 'AMX' },
            { label: 'Kramer', value: 'Kramer' },
            { label: 'QSC', value: 'QSC' },
            { label: 'CUE', value: 'CUE' },
            { label: 'Lutron', value: 'Lutron' },
        ]
      },
    ],
  },
  {
    title: '6. Mounts & Racks',
    questions: [
        {
          id: 'mountAndRackBrands',
          text: 'Are there any preferred Mount & Rack brands?',
          type: 'multiple-choice',
          options: [
            { label: 'Chief', value: 'Chief' },
            { label: 'Milestone', value: 'Milestone' },
            { label: 'B-Tech AV Mounts', value: 'B-Tech' },
            { label: 'Heckler Design', value: 'Heckler' },
            { label: 'LUMI', value: 'LUMI' },
            { label: 'Drita', value: 'Drita' },
            { label: 'Valrack', value: 'Valrack' },
            { label: 'Middle Atlantic', value: 'Middle Atlantic' },
            { label: 'Panduit', value: 'Panduit' },
            { label: 'Rittal', value: 'Rittal' },
            { label: 'APC', value: 'APC' },
            { label: 'Gigatronics', value: 'Gigatronics' },
          ]
        },
        {
            id: 'displayMountType',
            text: 'What type of mount is needed for the main display?',
            type: 'select',
            options: [
                { label: 'Fixed / Low-Profile Wall Mount', value: 'fixed_wall' },
                { label: 'Tilting Wall Mount', value: 'tilting_wall' },
                { label: 'Articulating Arm Wall Mount (for single displays)', value: 'articulating_wall' },
                { label: 'Push-Pull / Serviceable Video Wall Mount', value: 'video_wall_mount_push_pull' },
                { label: 'Recessed In-Wall Mount (for clean aesthetics)', value: 'recessed_wall' },
                { label: 'Ceiling Mount', value: 'ceiling_mount' },
                { label: 'Mobile Cart / Stand', value: 'mobile_cart' },
                { label: 'No specific mount needed (e.g., display has stand)', value: 'none' },
            ],
        },
        {
            id: 'cameraMounting',
            text: 'How should the video conferencing camera be mounted?',
            type: 'select',
            options: [
                { label: 'Integrated with display/video bar', value: 'integrated' },
                { label: 'On a shelf/mount above the display', value: 'above_display' },
                { label: 'On a shelf/mount below the display', value: 'below_display' },
                { label: 'On a dedicated wall mount', value: 'wall_mount' },
                { label: 'On a ceiling mount', value: 'ceiling_mount' },
                { label: 'On a Tripod (for mobile or temporary use)', value: 'tripod' },
                { label: 'Custom mount (specify in "Other Requirements")', value: 'custom_mount' },
                { label: 'Not applicable', value: 'na' },
            ],
        },
        {
            id: 'rackRequired',
            text: 'Is an equipment rack required?',
            type: 'select',
            options: [
                { label: 'Yes, a full-size floor-standing rack (42U)', value: '42u_rack' },
                { label: 'Yes, a half-size floor-standing rack (24U)', value: '24u_rack' },
                { label: 'Yes, a small credenza or wall-mount rack (12U)', value: '12u_rack' },
                { label: 'No, equipment will be mounted behind display or in furniture', value: 'no_rack' },
            ],
        },
    ]
  },
  {
    title: '7. Lighting & Acoustics',
    questions: [
        {
          id: 'lightingControl',
          text: 'Is integrated control of the room\'s lighting required?',
          type: 'select',
          options: [
            { label: 'No, lighting is separate', value: 'no' },
            { label: 'Basic Dimming Control', value: 'dimming' },
            { label: 'Full Integration (Scenes, Presets, etc.)', value: 'full_integration' },
          ],
        },
        {
          id: 'specialtyLighting',
          text: 'Are there any special lighting requirements?',
          type: 'multiple-choice',
          options: [
            { label: 'Stage / Presenter Lighting', value: 'stage_lighting' },
            { label: 'Architectural / Mood Lighting', value: 'architectural_lighting' },
            { label: 'Whiteboard / Focus Area Lighting', value: 'focus_lighting' },
          ],
        },
        {
            id: 'acousticNeeds',
            text: 'How would you describe the acoustic environment?',
            type: 'select',
            options: [
                { label: 'Standard office (some echo)', value: 'standard' },
                { label: 'Good (minimal echo, quiet)', value: 'good' },
                { label: 'Poor (very echoey, noisy, hard surfaces)', value: 'poor' },
            ]
        }
    ],
  },
  {
    title: '8. Additional Features',
    questions: [
        {
          id: 'roomScheduling',
          text: 'Is a room scheduling panel required outside the room?',
          type: 'select',
          options: [
            { label: 'Yes, a scheduling panel is needed', value: 'yes' },
            { label: 'No, not required', value: 'no' },
          ],
        },
        {
          id: 'lectureCapture',
          text: 'Is there a requirement to record or stream meetings?',
          type: 'select',
          options: [
            { label: 'Yes, recording and/or streaming is needed', value: 'yes' },
            { label: 'No, not required', value: 'no' },
          ],
        },
        {
          id: 'assistedListening',
          text: 'Is an Assisted Listening System (ALS) required for accessibility?',
          type: 'select',
          options: [
            { label: 'Yes, an ALS is required', value: 'yes' },
            { label: 'No, not required', value: 'no' },
          ],
        },
        { id: 'other', text: 'Are there any other specific requirements?', type: 'text' },
    ],
  },
];
