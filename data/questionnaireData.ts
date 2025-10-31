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
        type: 'multiple-choice',
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
            { label: 'Epson (Projectors)', value: 'Epson' },
            { label: 'Christie', value: 'Christie' },
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
        id: 'vcPlatform',
        text: 'What is the primary video conferencing platform?',
        type: 'select',
        options: [
          { label: 'Bring Your Own Device (BYOD) - Users connect laptops', value: 'byod' },
          { label: 'Dedicated Room System (e.g., Microsoft Teams Room, Zoom Room)', value: 'dedicated_room_system' },
          { label: 'Not Sure / Both', value: 'flexible_vc' },
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
        ]
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
        ]
      },
    ],
  },
  {
    title: '6. Additional Features',
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