import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, ArrowLeft, Check, Loader2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { cancelSubscription } from '../hooks/useSubscription';

interface SubscriptionCancelProps {
  onCancel?: () => void;
  onClose?: () => void;
}

const SubscriptionCancel: React.FC<SubscriptionCancelProps> = ({ onCancel, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const handleCancelSubscription = async () => {
    setIsLoading(true);

    try {
      const result = await cancelSubscription();

      toast({
        title: "🎉 Hủy đăng ký thành công!",
        description: result.message || 'Bạn đã được chuyển về gói miễn phí.',
        variant: "default",
      });

      // Call the onCancel callback if provided
      if (onCancel) {
        onCancel();
      }

      // Close the modal
      setShowConfirmation(false);
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Lỗi",
        description: error instanceof Error ? error.message : 'Có lỗi xảy ra khi hủy đăng ký',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!showConfirmation) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4"
      >
        <motion.button
          type="button"
          onClick={() => setShowConfirmation(true)}
          disabled={isLoading}
          whileHover={{ scale: 1.02, y: -2 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-300 ease-out hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 touch-manipulation"
        >
          <X className="h-4 w-4" />
          Hủy Đăng Ký
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-gray-300 ring-1 ring-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-900">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Xác Nhận Hủy Đăng Ký
          </h3>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-300"
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
            aria-label="Đóng hộp thoại"
          >
            <X className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            <p className="text-gray-700 font-medium">
              <strong>Bạn có chắc chắn muốn hủy đăng ký không?</strong>
            </p>

            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-gray-600">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <ArrowLeft className="h-4 w-4 text-yellow-500 rotate-90" />
                </motion.div>
                <span>Bạn sẽ được chuyển về <strong>gói miễn phí</strong></span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <X className="h-4 w-4 text-red-500" />
                </motion.div>
                <span>Giới hạn phân tích CV: <strong>3 lần/tháng</strong></span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <X className="h-4 w-4 text-red-500" />
                </motion.div>
                <span>Giới hạn phân tích công việc: <strong>1 lần/tháng</strong></span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <X className="h-4 w-4 text-red-500" />
                </motion.div>
                <span>Mất quyền truy cập các tính năng cao cấp</span>
              </li>
              <li className="flex items-center gap-3 text-gray-600">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <X className="h-4 w-4 text-red-500" />
                </motion.div>
                <span>Không có hỗ trợ ưu tiên</span>
              </li>
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3"
            >
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              <span className="text-blue-800">Bạn có thể nâng cấp lại bất cứ lúc nào.</span>
            </motion.div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 p-6 border-t border-gray-200 sm:justify-end">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 order-2 sm:order-1 touch-manipulation"
            onClick={() => setShowConfirmation(false)}
            disabled={isLoading}
          >
            <ArrowLeft className="h-4 w-4" />
            Quay Lại
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 order-1 sm:order-2 touch-manipulation"
            onClick={handleCancelSubscription}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Xác Nhận Hủy
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default SubscriptionCancel;
