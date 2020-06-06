const ArgumentType = require('../../extension-support/argument-type');
const BlockType = require('../../extension-support/block-type');
const Cast = require('../../util/cast');
const log = require('../../util/log');
const ml5 = require('ml5');
const formatMessage = require('format-message');

const HAT_TIMEOUT = 100;

const blockIconURI = 'data:image/png;base64,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';

const Message = {
  when_received_block: {
    'ja': '認識結果を受け取ったとき',
    'ja-Hira': 'にんしきけっかをうけとったとき',
    'en': 'when received classification results',
    'zh-cn': '收到分类结果时'
  },
  result1: {
    'ja': '認識結果1',
    'ja-Hira': 'にんしきけっか1',
    'en': 'result1',
    'zh-cn': '结果1'
  },
  result2: {
    'ja': '認識結果2',
    'ja-Hira': 'にんしきけっか2',
    'en': 'result2',
    'zh-cn': '结果2'
  },
  result3: {
    'ja': '認識結果3',
    'ja-Hira': 'にんしきけっか3',
    'en': 'result3',
    'zh-cn': '结果3'
  },
  confidence1: {
    'ja': '精度1',
    'ja-Hira': 'せいど1',
    'en': 'confidence1',
    'zh-cn': '置信度1'
  },
  confidence2: {
    'ja': '精度2',
    'ja-Hira': 'せいど2',
    'en': 'confidence2',
    'zh-cn': '置信度2'
  },
  confidence3: {
    'ja': '精度3',
    'ja-Hira': 'せいど3',
    'en': 'confidence3',
    'zh-cn': '置信度3'
  },
  toggle_classification: {
    'ja': '画像認識を[CLASSIFICATION_STATE]にする',
    'ja-Hira': 'がぞうにんしきを[CLASSIFICATION_STATE]にする',
    'en': 'turn classification [CLASSIFICATION_STATE]',
    'zh-cn': '[CLASSIFICATION_STATE]分类'
  },
  set_classification_interval: {
    'ja': '画像認識を[CLASSIFICATION_INTERVAL]秒間に1回行う',
    'ja-Hira': 'がぞうにんしきを[CLASSIFICATION_INTERVAL]びょうかんに1かいおこなう',
    'en': 'Classify once every [CLASSIFICATION_INTERVAL] seconds',
    'zh-cn': '每隔[CLASSIFICATION_INTERVAL]秒标记一次'
  },
  video_toggle: {
    'ja': 'ビデオを[VIDEO_STATE]にする',
    'ja-Hira': 'ビデオを[VIDEO_STATE]にする',
    'en': 'turn video [VIDEO_STATE]',
    'zh-cn': '[VIDEO_STATE]摄像头'
  },
  on: {
    'ja': '入',
    'ja-Hira': 'いり',
    'en': 'on',
    'zh-cn': '开启'
  },
  off: {
    'ja': '切',
    'ja-Hira': 'きり',
    'en': 'off',
    'zh-cn': '关闭'
  },
  video_on_flipped: {
    'ja': '左右反転',
    'ja-Hira': 'さゆうはんてん',
    'en': 'on flipped',
    'zh-cn': '镜像开启'
  }
}

const AvailableLocales = ['en', 'ja', 'ja-Hira', 'zh-cn'];

class Scratch3ImageClassifierBlocks {
  constructor (runtime) {
    this.runtime = runtime;
    this.when_received = false;
    this.results = [];
    this.locale = this.setLocale();

    this.video = document.createElement("video");
    this.video.width = 480;
    this.video.height = 360;
    this.video.autoplay = true;
    this.video.style.display = "none";

    this.blockClickedAt = null;

    this.interval = 1000;

    let media = navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false
    });

    media.then((stream) => {
      this.video.srcObject = stream;
    });

    this.classifier = ml5.imageClassifier('MobileNet', () => {
      console.log('Model Loaded!');
      this.timer = setInterval(() => {
        this.classify();
      }, this.interval);
    });

    this.runtime.ioDevices.video.enableVideo();
  }

  getInfo() {
    this.locale = this.setLocale();

    return {
      id: 'ic2scratch',
      name: 'ImageClassifier2Scratch',
      blockIconURI: blockIconURI,
      blocks: [
        {
          opcode: 'getResult1',
          text: Message.result1[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getResult2',
          text: Message.result2[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getResult3',
          text: Message.result3[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getConfidence1',
          text: Message.confidence1[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getConfidence2',
          text: Message.confidence2[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'getConfidence3',
          text: Message.confidence3[this.locale],
          blockType: BlockType.REPORTER
        },
        {
          opcode: 'whenReceived',
          text: Message.when_received_block[this.locale],
          blockType: BlockType.HAT,
        },
        {
          opcode: 'toggleClassification',
          text: Message.toggle_classification[this.locale],
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFICATION_STATE: {
              type: ArgumentType.STRING,
              menu: 'classification_menu',
              defaultValue: 'off'
            }
          }
        },
        {
          opcode: 'setClassificationInterval',
          text: Message.set_classification_interval[this.locale],
          blockType: BlockType.COMMAND,
          arguments: {
            CLASSIFICATION_INTERVAL: {
              type: ArgumentType.STRING,
              menu: 'classification_interval_menu',
              defaultValue: '1'
            }
          }
        },
        {
          opcode: 'videoToggle',
          text: Message.video_toggle[this.locale],
          blockType: BlockType.COMMAND,
          arguments: {
            VIDEO_STATE: {
              type: ArgumentType.STRING,
              menu: 'video_menu',
              defaultValue: 'off'
            }
          }
        }
      ],
      menus: {
        video_menu: this.getVideoMenu(),
        classification_interval_menu: this.getClassificationIntervalMenu(),
        classification_menu: this.getClassificationMenu()
      }
    };
  }

  getResult1() {
    return this.results[0]['label'];
  }

  getResult2() {
    return this.results[1]['label'];
  }

  getResult3() {
    return this.results[2]['label'];
  }

  getConfidence1() {
    return this.results[0]['confidence'];
  }

  getConfidence2() {
    return this.results[1]['confidence'];
  }

  getConfidence3() {
    return this.results[2]['confidence'];
  }

  whenReceived(args) {
    if (this.when_received) {
      setTimeout(() => {
          this.when_received = false;
      }, HAT_TIMEOUT);
      return true;
    }
    return false;
  }

  toggleClassification (args) {
    if (this.actionRepeated()) { return };

    let state = args.CLASSIFICATION_STATE;
    if (this.timer) {
      clearTimeout(this.timer);
    }
    if (state === 'on') {
      this.timer = setInterval(() => {
        this.classify();
      }, this.interval);
    }
  }

  setClassificationInterval (args) {
    if (this.actionRepeated()) { return };

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.interval = args.CLASSIFICATION_INTERVAL * 1000;
    this.timer = setInterval(() => {
      this.classify();
    }, this.interval);
  }

  videoToggle (args) {
    if (this.actionRepeated()) { return };

    let state = args.VIDEO_STATE;
    if (state === 'off') {
      this.runtime.ioDevices.video.disableVideo();
    } else {
      this.runtime.ioDevices.video.enableVideo();
      this.runtime.ioDevices.video.mirror = state === "on";
    }
  }

  classify() {
    this.classifier.classify(this.video, (err, results) => {
      if (err) {
        console.error(err);
      } else {
        this.when_received = true;
        this.results = results;
      }
    });
  }

  actionRepeated() {
    let currentTime = Date.now();
    if (this.blockClickedAt && (this.blockClickedAt + 250) > currentTime) {
      console.log('Please do not repeat trigerring this block.');
      this.blockClickedAt = currentTime;
      return true;
    } else {
      this.blockClickedAt = currentTime;
      return false;
    }
  }

  getVideoMenu() {
    return [
      {
        text: Message.off[this.locale],
        value: 'off'
      },
      {
        text: Message.on[this.locale],
        value: 'on'
      },
      {
        text: Message.video_on_flipped[this.locale],
        value: 'on-flipped'
      }
    ]
  }

  getClassificationIntervalMenu() {
    return [
      {
        text: '5',
        value: '5'
      },
      {
        text: '2',
        value: '2'
      },
      {
        text: '1',
        value: '1'
      },
      {
        text: '0.5',
        value: '0.5'
      }
    ]
  }

  getClassificationMenu() {
    return [
      {
        text: Message.off[this.locale],
        value: 'off'
      },
      {
        text: Message.on[this.locale],
        value: 'on'
      }
    ]
  }

  setLocale() {
    let locale = formatMessage.setup().locale;
    if (AvailableLocales.includes(locale)) {
      return locale;
    } else {
      return 'en';
    }
  }
}

module.exports = Scratch3ImageClassifierBlocks;
