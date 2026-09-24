// Offline fallback deck. Short summaries are written in our own words; PDF links are real arXiv papers.
const p = (id, title, authors, published, categories, abstract) => ({
  id, title, authors, published, categories, abstract,
  pdf: `https://arxiv.org/pdf/${id}`, url: `https://arxiv.org/abs/${id}`
});
export const MOCK = [
  p('1706.03762', 'Attention Is All You Need', ['Ashish Vaswani', 'Noam Shazeer', 'Niki Parmar', 'Jakob Uszkoreit'], '2017-06-12T17:57:34Z', ['cs.CL', 'cs.LG'],
    'Introduces the Transformer, a sequence model built entirely on attention with no recurrence or convolution. It trains faster, parallelises well, and set new translation quality records on the WMT benchmarks.'),
  p('1810.04805', 'BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding', ['Jacob Devlin', 'Ming-Wei Chang', 'Kenton Lee', 'Kristina Toutanova'], '2018-10-11T00:50:01Z', ['cs.CL'],
    'Pre-trains a Transformer to read text in both directions by predicting masked words. One simple fine-tuning step then lifts results across a wide range of language understanding tasks.'),
  p('2005.14165', 'Language Models are Few-Shot Learners', ['Tom B. Brown', 'Benjamin Mann', 'Nick Ryder', 'Melanie Subbiah'], '2020-05-28T17:29:03Z', ['cs.CL'],
    'Scales an autoregressive language model to 175 billion parameters and shows it can pick up new tasks from a handful of examples in the prompt, with no gradient updates.'),
  p('2001.08361', 'Scaling Laws for Neural Language Models', ['Jared Kaplan', 'Sam McCandlish', 'Tom Henighan', 'Tom B. Brown'], '2020-01-23T03:59:20Z', ['cs.LG', 'stat.ML'],
    'Finds that language model loss falls as a smooth power law in model size, dataset size and compute, and uses those trends to suggest how to split a fixed training budget.'),
  p('2006.11239', 'Denoising Diffusion Probabilistic Models', ['Jonathan Ho', 'Ajay Jain', 'Pieter Abbeel'], '2020-06-19T17:24:44Z', ['cs.LG', 'stat.ML'],
    'Shows that generating images by learning to reverse a gradual noising process yields high quality samples, reviving diffusion models as a serious alternative to GANs.'),
  p('2106.09685', 'LoRA: Low-Rank Adaptation of Large Language Models', ['Edward J. Hu', 'Yelong Shen', 'Phillip Wallis', 'Zeyuan Allen-Zhu'], '2021-06-17T17:37:18Z', ['cs.CL', 'cs.AI'],
    'Freezes a pretrained model and trains small low-rank update matrices instead. This cuts trainable parameters and memory sharply while matching full fine-tuning quality.'),
  p('2201.11903', 'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models', ['Jason Wei', 'Xuezhi Wang', 'Dale Schuurmans', 'Maarten Bosma'], '2022-01-28T02:07:12Z', ['cs.CL', 'cs.AI'],
    'Shows that prompting a large model with worked, step-by-step examples makes it far better at arithmetic, commonsense and symbolic reasoning problems.'),
  p('1412.6980', 'Adam: A Method for Stochastic Optimization', ['Diederik P. Kingma', 'Jimmy Ba'], '2014-12-22T13:54:29Z', ['cs.LG'],
    'Presents Adam, a first-order optimiser that keeps running estimates of gradient moments to give each parameter its own step size. It is simple, light on memory and works well by default.')
];
