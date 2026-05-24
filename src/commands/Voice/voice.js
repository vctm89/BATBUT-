import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

import {
  joinVoiceChannel,
  getVoiceConnection,
} from '@discordjs/voice';

export default {
  data: new SlashCommandBuilder()
    .setName('voice')
    .setDescription('تحكم بدخول وخروج البوت من الروم الصوتي')
    .setDMPermission(false)

    .addSubcommand(subcommand =>
      subcommand
        .setName('join')
        .setDescription('إدخال البوت إلى روم صوتي')
        .addChannelOption(option =>
          option
            .setName('channel')
            .setDescription('اختار الروم الصوتي')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)
        )
    )

    .addSubcommand(subcommand =>
      subcommand
        .setName('leave')
        .setDescription('إخراج البوت من الروم الصوتي')
    ),

  async execute(interaction) {
    const ownerIds = (process.env.OWNER_IDS || '')
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (!ownerIds.includes(interaction.user.id)) {
      return interaction.reply({
        content: '❌ هذا الأمر لصاحب البوت فقط.',
        ephemeral: true,
      });
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'join') {
      const channel = interaction.options.getChannel('channel');

      const botMember = interaction.guild.members.me;
      const permissions = channel.permissionsFor(botMember);

      if (
        !permissions?.has(PermissionFlagsBits.ViewChannel) ||
        !permissions?.has(PermissionFlagsBits.Connect)
      ) {
        return interaction.reply({
          content: '❌ لازم تعطيني صلاحيات View Channel و Connect داخل هذا الروم.',
          ephemeral: true,
        });
      }

      const oldConnection = getVoiceConnection(interaction.guild.id);

      if (oldConnection) {
        oldConnection.destroy();
      }

      joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: true,
        selfMute: true,
      });

      return interaction.reply({
        content: `✅ دخلت على ${channel} وسأبقى فيه حتى تخرجني أنت.`,
        ephemeral: true,
      });
    }

    if (subcommand === 'leave') {
      const connection = getVoiceConnection(interaction.guild.id);

      if (!connection) {
        return interaction.reply({
          content: '❌ أنا لست داخل أي روم صوتي حالياً.',
          ephemeral: true,
        });
      }

      connection.destroy();

      return interaction.reply({
        content: '✅ خرجت من الروم الصوتي.',
        ephemeral: true,
      });
    }
  },
};
