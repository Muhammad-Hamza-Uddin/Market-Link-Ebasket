const Notification = require('../models/Notification');

const createNotification = async (data) => {
  if (data.eventKey) {
    return Notification.findOneAndUpdate(
      { user: data.user, eventKey: data.eventKey },
      { $setOnInsert: data },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  return Notification.create(data);
};

const notifyAdmins = async (data) => {
  const User = require('../models/User');
  const admins = await User.find({ role: 'admin', accountStatus: 'active' }).select('_id');
  return Promise.all(admins.map((admin) => createNotification({ ...data, user: admin._id })));
};

module.exports = { createNotification, notifyAdmins };