var _moment = require('moment');
module.exports = {
    filter_array: function (test_array) {
        var index = -1,
            arr_length = test_array ? test_array.length : 0,
            resIndex = -1,
            result = [];

        while (++index < arr_length) {
            var value = test_array[index];

            if (value) {
                result[++resIndex] = value;
            }
        }

        return result;
    },
    daterange_wildcard: function (from, to) {
        from = _moment(from).hour(0).minute(0).second(0).millisecond(0);
        to = _moment(to).hour(0).minute(0).second(0).millisecond(0);

        var from_month = from.format('YYYYMM');
        var from_dayago_month = _moment(from).subtract('1', 'days').format('YYYYMM');
        var to_afterday_month = _moment(to).add('1', 'days').format('YYYYMM');

        var daterange = [];

        //daterange.push(from.format('YYYYMM')+'*');
        //daterange.push(to.format('YYYYMM')+'*');

        // while (from_dayago_month === from_month && from < to) {
        //     daterange.push(from.format('YYYYMMDD'));
        //     // move 1 day
        //     from_month = from.add(1, 'days').format('YYYYMM');
        // }

        while (from_month < to_afterday_month) {
            daterange.push(from.format('YYYYMM') + '*');
            // move 1 month
            from_month = from.add(1, 'month').format('YYYYMM');
        }

        while (from <= to) {
            daterange.push(from.format('YYYYMM') + '*');
            // move 1 day
            from_month = from.add(1, 'month').format('YYYYMM');
        }

        return daterange;
    },
    isEmpty: function (value) {
        if (value == "" || value == null || value == undefined || (value != null && typeof value == "object" && !Object.keys(value).length)) {
            return true;
        } else {
            return false;
        }
    },
    replaceAll: function (str, searchStr, replaceStr) {
        return str.split(searchStr).join(replaceStr);
    },
    isLength: function (query) {
        var requery = '';
        if (typeof query != 'undefined' && query.length > 0) {
            requery = query.replace(/\s+/g, ' ').substr(0, 100);
        }
        return requery;
    },
    durationTime: function (startdt, enddt) {
        const minuteDiff = enddt.diff(startdt, "minutes");
        const secondDiff = enddt.diff(startdt, "seconds");
        const minuteDuration = Math.floor(secondDiff / 60);
        const secondDuration = secondDiff % 60;
        return `수집 -> 색인완료시간은 ${minuteDuration}분 ${secondDuration}초 입니다`
    },
    arrayToObject: (array) =>
        array.reduce((obj, item) => {
            obj[item.model_id] = item
            return obj
        }, {})
};