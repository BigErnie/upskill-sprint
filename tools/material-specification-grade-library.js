(function () {
  'use strict';
  if (!window.MaterialCheckerConfig) return;

  const OTHER = 'Other / not listed';
  const withOther = function (items) { return items.concat(OTHER); };

  window.MaterialCheckerConfig.LIB = {
    CSA: {
      'CSA G40.21': withOther([
        'Grade 230G (33G)', 'Grade 260G (38G)', 'Grade 300G (44G)',
        'Grade 230W (33W)', 'Grade 260W (38W)', 'Grade 300W (44W)',
        'Grade 350W (50W)', 'Grade 350WT (50WT)',
        'Grade 350A (50A)', 'Grade 350AT (50AT)',
        'Grade 400W (60W)', 'Grade 480W (70W)'
      ]),
      'CSA Z245.1': withOther([
        'Grade 241', 'Grade 290', 'Grade 359', 'Grade 386', 'Grade 414',
        'Grade 448', 'Grade 483', 'Grade 550', 'Grade 620', 'Grade 690', 'Grade 825'
      ]),
      [OTHER]: ['Custom designation']
    },

    ASTM: {
      'ASTM A36/A36M': withOther(['Grade A36']),
      'ASTM A572/A572M': withOther(['Grade 42', 'Grade 50', 'Grade 55', 'Grade 60', 'Grade 65']),
      'ASTM A588/A588M': withOther(['Grade A', 'Grade B', 'Grade C', 'Grade K']),
      'ASTM A709/A709M': withOther([
        'Grade 36', 'Grade 50', 'Grade 50S', 'Grade 50W',
        'HPS Grade 50W', 'HPS Grade 70W', 'HPS Grade 100W'
      ]),
      'ASTM A913/A913M': withOther(['Grade 50', 'Grade 60', 'Grade 65', 'Grade 70', 'Grade 80']),
      'ASTM A992/A992M': withOther(['Grade 50']),
      'ASTM A514/A514M': withOther(['Grade A', 'Grade B', 'Grade E', 'Grade F', 'Grade H', 'Grade P', 'Grade Q', 'Grade S']),
      'ASTM A656/A656M': withOther(['Grade 50', 'Grade 60', 'Grade 70', 'Grade 80', 'Grade 100']),
      'ASTM A710/A710M': withOther(['Grade A, Class 1', 'Grade A, Class 2', 'Grade A, Class 3']),

      'ASTM A285/A285M': withOther(['Grade A', 'Grade B', 'Grade C']),
      'ASTM A299/A299M': withOther(['Grade A', 'Grade B']),
      'ASTM A516/A516M': withOther(['Grade 55', 'Grade 60', 'Grade 65', 'Grade 70']),
      'ASTM A537/A537M': withOther(['Class 1', 'Class 2', 'Class 3']),
      'ASTM A387/A387M': withOther([
        'Grade 2, Class 1', 'Grade 2, Class 2',
        'Grade 5, Class 1', 'Grade 5, Class 2',
        'Grade 9, Class 1', 'Grade 9, Class 2',
        'Grade 11, Class 1', 'Grade 11, Class 2',
        'Grade 12, Class 1', 'Grade 12, Class 2',
        'Grade 21, Class 1', 'Grade 21, Class 2',
        'Grade 22, Class 1', 'Grade 22, Class 2',
        'Grade 91, Class 2'
      ]),

      'ASTM A53/A53M': withOther(['Grade A', 'Grade B']),
      'ASTM A106/A106M': withOther(['Grade A', 'Grade B', 'Grade C']),
      'ASTM A333/A333M': withOther(['Grade 1', 'Grade 3', 'Grade 4', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11']),
      'ASTM A335/A335M': withOther([
        'Grade P1', 'Grade P2', 'Grade P5', 'Grade P5b', 'Grade P5c',
        'Grade P7', 'Grade P9', 'Grade P11', 'Grade P12', 'Grade P15',
        'Grade P21', 'Grade P22', 'Grade P23', 'Grade P24', 'Grade P36',
        'Grade P91', 'Grade P92', 'Grade P122'
      ]),
      'ASTM A252': withOther(['Grade 1', 'Grade 2', 'Grade 3']),
      'ASTM A312/A312M': withOther([
        'Grade TP304', 'Grade TP304L', 'Grade TP304H',
        'Grade TP316', 'Grade TP316L', 'Grade TP316H',
        'Grade TP321', 'Grade TP321H', 'Grade TP347', 'Grade TP347H'
      ]),

      'ASTM A500/A500M': withOther(['Grade A', 'Grade B', 'Grade C', 'Grade D']),
      'ASTM A501/A501M': withOther(['Grade A', 'Grade B']),

      'ASTM A1011/A1011M': withOther([
        'Commercial Steel (CS), Type A', 'Commercial Steel (CS), Type B', 'Commercial Steel (CS), Type C',
        'Drawing Steel (DS), Type A', 'Drawing Steel (DS), Type B',
        'Structural Steel (SS), Grade 30', 'Structural Steel (SS), Grade 33',
        'Structural Steel (SS), Grade 36, Type 1', 'Structural Steel (SS), Grade 36, Type 2',
        'Structural Steel (SS), Grade 40, Type 1', 'Structural Steel (SS), Grade 40, Type 2',
        'Structural Steel (SS), Grade 45, Type 1', 'Structural Steel (SS), Grade 45, Type 2',
        'Structural Steel (SS), Grade 50', 'Structural Steel (SS), Grade 55',
        'Structural Steel (SS), Grade 60', 'Structural Steel (SS), Grade 65',
        'Structural Steel (SS), Grade 70', 'Structural Steel (SS), Grade 80'
      ]),
      'ASTM A1018/A1018M': withOther([
        'Commercial Steel (CS)', 'Drawing Steel (DS)',
        'Structural Steel (SS), Grade 30', 'Structural Steel (SS), Grade 33',
        'Structural Steel (SS), Grade 36', 'Structural Steel (SS), Grade 40',
        'Structural Steel (SS), Grade 45', 'Structural Steel (SS), Grade 50',
        'Structural Steel (SS), Grade 55', 'Structural Steel (SS), Grade 60',
        'Structural Steel (SS), Grade 65', 'Structural Steel (SS), Grade 70',
        'Structural Steel (SS), Grade 80',
        'HSLAS, Grade 45', 'HSLAS, Grade 50', 'HSLAS, Grade 55',
        'HSLAS, Grade 60', 'HSLAS, Grade 65', 'HSLAS, Grade 70', 'HSLAS, Grade 80',
        'HSLAS-F, Grade 50', 'HSLAS-F, Grade 60', 'HSLAS-F, Grade 70', 'HSLAS-F, Grade 80'
      ]),
      'ASTM A606/A606M': withOther(['Type 2', 'Type 4']),
      [OTHER]: ['Custom designation']
    },

    API: {
      'API Specification 5L': withOther([
        'Grade L175 / A25', 'Grade L175P / A25P', 'Grade L210 / A',
        'Grade L245 / B', 'Grade L290 / X42', 'Grade L320 / X46',
        'Grade L360 / X52', 'Grade L390 / X56', 'Grade L415 / X60',
        'Grade L450 / X65', 'Grade L485 / X70', 'Grade L555 / X80',
        'Grade L625 / X90', 'Grade L690 / X100', 'Grade L830 / X120'
      ]),
      'API Specification 5CT': withOther([
        'Grade H40', 'Grade J55', 'Grade K55', 'Grade M65',
        'Grade N80, Type 1', 'Grade N80, Type Q',
        'Grade L80, Type 1', 'Grade L80, Type 9Cr', 'Grade L80, Type 13Cr',
        'Grade C90, Type 1', 'Grade C95', 'Grade T95, Type 1',
        'Grade C110', 'Grade P110', 'Grade Q125'
      ]),
      'API Specification 5DP': withOther(['Grade E-75', 'Grade X-95', 'Grade G-105', 'Grade S-135']),
      [OTHER]: ['Custom designation']
    },

    Customer: {'Customer specification': ['Custom designation']},
    Internal: {'Internal specification': ['Custom designation']},
    Other: {[OTHER]: ['Custom designation']}
  };

  window.MaterialCheckerGradeLibraryMeta = {
    version: '2026-07-15',
    purpose: 'Designation catalogue only. It does not supply acceptance limits or establish equivalency.',
    cautions: [
      'Verify the exact controlled edition, product form, thickness range, class, type, category, PSL, delivery condition, and supplementary requirements.',
      'A similar strength number does not establish equivalency between CSA, ASTM, and API grades.',
      'Use Other / not listed for valid edition-specific designations that are not in this catalogue.'
    ]
  };
}());
