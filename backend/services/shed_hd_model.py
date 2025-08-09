import torch
import torch.nn as nn
import torch.nn.functional as F

class EntropyClassifier(nn.Module):
    """BiLSTM + Attention classifier for entropy sequences"""
    
    def __init__(self, input_dim, hidden_dims, dropout_rate=0.4):
        super(EntropyClassifier, self).__init__()

        # Input embedding and normalization
        self.input_embedding = nn.Sequential(
            nn.Linear(1, 64),
            nn.LayerNorm(64),
            nn.GELU(),
            nn.Dropout(dropout_rate)
        )

        # Bidirectional LSTM
        self.lstm = nn.LSTM(
            input_size=64,
            hidden_size=128,
            num_layers=2,
            batch_first=True,
            dropout=0.4,
            bidirectional=True
        )

        # Attention mechanism
        self.attention = nn.Sequential(
            nn.Linear(256, 64),
            nn.Tanh(),
            nn.Dropout(dropout_rate),
            nn.Linear(64, 1)
        )

        # Classifier layers
        self.layers = nn.ModuleList()

        # Input layer (256 from BiLSTM output)
        self.layers.append(nn.Linear(256, hidden_dims[0]))
        self.layers.append(nn.LayerNorm(hidden_dims[0]))
        self.layers.append(nn.GELU())
        self.layers.append(nn.Dropout(dropout_rate))

        # Hidden layers
        for i in range(len(hidden_dims)-1):
            self.layers.append(nn.Linear(hidden_dims[i], hidden_dims[i+1]))
            self.layers.append(nn.LayerNorm(hidden_dims[i+1]))
            self.layers.append(nn.GELU())
            self.layers.append(nn.Dropout(dropout_rate))

        # Output layer
        self.output_layer = nn.Linear(hidden_dims[-1], 2)

    def forward(self, x, return_attention=False):
        # Create mask for padding values
        mask = (x != -1).float()

        # Replace padding with zeros
        x = x * mask

        # Reshape for embedding: [batch_size, seq_len] -> [batch_size, seq_len, 1]
        x = x.unsqueeze(-1)

        # Apply embedding
        x = self.input_embedding(x)  # [batch_size, seq_len, 64]

        # Apply LSTM
        x, _ = self.lstm(x)  # [batch_size, seq_len, 256]

        # Apply attention
        attn_weights = self.attention(x)  # [batch_size, seq_len, 1]
        attn_weights = attn_weights.squeeze(-1)  # [batch_size, seq_len]

        # Mask out padding tokens
        attn_weights = attn_weights.masked_fill(mask == 0, -1e9)
        attn_weights = F.softmax(attn_weights, dim=1)  # [batch_size, seq_len]

        # Apply attention weights
        context = torch.bmm(attn_weights.unsqueeze(1), x).squeeze(1)  # [batch_size, 256]

        # Apply classifier layers
        for layer in self.layers:
            context = layer(context)

        if return_attention:
            return self.output_layer(context), attn_weights
        else:
            return self.output_layer(context)
